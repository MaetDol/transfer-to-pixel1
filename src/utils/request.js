const PromisePool = require('./PromisePool.js');
const http = require('http');

const log = require('./logger.js');
const promisePool = new PromisePool(300 * 1024 * 1024);

async function send(file, doDelete, fetcher) {
  const headers = {
    'Content-Type': `${file.mediaType}/${file.ext}`,
    'Content-Disposition': `attachment; filename=\"${encodeURI(file.name)}\"`,
  };

  return promisePool
    .push(_ => fetcher(headers, file.read()), file.size)
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
            resolve(res.statusCode);
          });
        }
      );

      req.on('error', e => {
        if (e) reject(e);
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
