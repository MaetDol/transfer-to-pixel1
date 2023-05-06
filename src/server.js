const http = require('http');
const fs = require('fs');
const path = require('path');
const log = require('./utils/logger.js');
const Properties = require('./utils/Properties.js');

const prop = new Properties(path.resolve(__dirname, '../properties.json'));
const { ROOT, PORT, UPLOAD_DIR } = prop.value;

const UPLOAD = path.join(ROOT, UPLOAD_DIR);
if (!fs.existsSync(UPLOAD)) {
  log.info(`Directory ${UPLOAD} is not exists. creating..`);
  fs.mkdirSync(UPLOAD, { recursive: true });
}

http
  .createServer((req, res) => {
    try {
      log.info('\n');
      log.info(new Date());
      log.info(req.headers);
      log.info(req.method);

      res.setHeader('Access-Control-Allow-Headers', '*');
      res.setHeader('Access-Control-Allow-Origin', '*');

      if (req.method.toUpperCase() === 'OPTIONS') {
        res.end();
        return;
      }

      if (!/image|video|audio/.test(req.headers['content-type'])) {
        log.err('invalid content-type');
        res.writeHead(400).end();
        return;
      }

      if (req.method.toUpperCase() !== 'POST') {
        log.err('invalid method');
        res.writeHead(405).end();
        return;
      }

      const data = [];
      req.on('data', d => data.push(d));
      req.on('end', _ => {
        // Timeout after 20sec
        let filename = 'undefined';
        const abortController = new AbortController();
        let timeoutId = setTimeout(() => {
          log.err(`Timedout while processing ${filename}`);
          abortController.abort();
          res.writeHead(500).end();
        }, 1000 * 20);

        try {
          const buffer = Buffer.concat(data);
          const [, encodedName] =
            req.headers['content-disposition'].match(/filename="(.+)"/);
          if (!encodedName) {
            log.err('filename not provided');
            res.writeHead(415).end();
            return;
          }

          filename = decodeURI(encodedName);
          save(filename, buffer, abortController.signal);
          res.writeHead(200).end();
        } catch (e) {
          log.err('Failed while save file ' + e);
          res.writeHead(500).end();
        } finally {
          clearTimeout(timeoutId);
        }
      });
    } catch (e) {
      log.err('Internal server error ' + e);
      res.writeHead(500).end();
    }
  })
  .listen(PORT, () => {
    log.info('Server is Running');
    log.info(new Date());
  });

function save(name, file, abortSignal) {
  fs.appendFileSync(path.resolve(UPLOAD, name), file, {
    flag: 'w',
    signal: abortSignal,
  });
}
