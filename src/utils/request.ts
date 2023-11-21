import type { ReadStream } from 'fs';
import type { OutgoingHttpHeaders } from 'http';
import http from 'http';
// @ts-ignore
import { PromisePool } from './PromisePool';
import { log } from './logger';
// @ts-ignore
import type { File } from './File';

const TIMEOUT_MS = 1000 * 60 * 5;
const MAX_POOL_SIZE_BYTE = 300 * 1024 * 1024;

const promisePool = new PromisePool(MAX_POOL_SIZE_BYTE);

async function send(
  file: File,
  doDelete: boolean,
  fetcher: (
    headers: OutgoingHttpHeaders,
    fileStream: ReadStream
  ) => Promise<number>
) {
  const headers = {
    'Content-Type': `${file.mediaType}/${file.ext}`,
    'Content-Disposition': `attachment; filename=\"${encodeURI(file.name)}\"`,
    'Content-Length': file.size,
  };

  const _send = () => {
    log.info(`Sending file: ${file.name}`, true);
    return fetcher(headers, file.readAsStream());
  };

  return promisePool
    .push(_send, file.size)
    .then((code: number) => {
      if (doDelete) file.delete();
      return code;
    })
    .catch((code: number) => {
      log.err(
        `Upload "${file.name}", ${file.readableSize()}, but got an : ${code}`
      );
      return { path: file.path, mode: file.mode };
    });
}

function createRequestFunction(hostname: string, port: `${number}` | number) {
  return function request(headers: OutgoingHttpHeaders, content: ReadStream) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => reject('Timedout'), TIMEOUT_MS);
      const req = http.request(
        {
          hostname,
          port,
          headers,
          method: 'POST',
        },
        res => {
          res.on('error', e => log.err(`Response error? ${e}`));
          res.on('data', () => {});
          res.on('end', () => {
            if (res.statusCode !== 200) reject(res.statusCode);
            clearTimeout(timeoutId);
            resolve(res.statusCode);
          });
        }
      );

      req.on('error', e => {
        clearTimeout(timeoutId);
        reject(e);
      });

      content.on('open', () => {
        content.pipe(req);
      });
      content.on('error', err => {
        log.err('Error during file streaming' + err);
        req.destroy();
      });
      content.on('end', () => {
        req.end();
      });
    });
  };
}

module.exports = {
  send,
  createRequestFunction,
};
