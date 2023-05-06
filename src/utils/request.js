const PromisePool = require('./PromisePool.js');
const http = require('http');
const log = require('./logger.js');

const TIMEOUT_MS = 100 * 1000;
const MAX_POOL_SIZE_BYTE = 300 * 1024 * 1024;

const promisePool = new PromisePool(MAX_POOL_SIZE_BYTE);

async function send(file, doDelete, fetcher) {
  const headers = {
    'Content-Type': `${file.mediaType}/${file.ext}`,
    'Content-Disposition': `attachment; filename=\"${encodeURI(file.name)}\"`,
    'Content-Length': file.size,
  };

  const _send = () => {
    log.info(`Sending file: ${file.name}`, true);
    return fetcher(headers, file.read());
  };

  return promisePool
    .push(_send, file.size)
    .then(code => {
      if (doDelete) file.delete();
      return code;
    })
    .catch(code => {
      log.err(
        `Upload "${file.name}", ${file.readableSize()}, but got an : ${code}`
      );
      return { path: file.path, mode: file.mode };
    });
}

function createRequestFunction(hostname, port) {
  return function request(headers, content) {
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
          res.on('data', _ => 0);
          res.on('end', _ => {
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

      req.write(content);
      req.end();
    });
  };
}

module.exports = {
  send,
  createRequestFunction,
};
