const fs = require('fs');
const path = require('path');
const log = require('./utils/logger.js');
const Properties = require('./utils/Properties.js');
const { File, Ignores, getNewFiles, Exif } = require('./utils/File');
const { send, createRequestFunction } = require('./utils/request.js');

log.info(new Date());
const prop = new Properties(path.resolve(__dirname, '../properties.json'));
const {
  LAST_UPDATE,
  ROOT,
  SERVER,
  PORT,
  DELETE_AFTER_UPLOAD,
  targets,
  ignores: ignorePaths,
} = prop.value;

const request = createRequestFunction(SERVER, PORT);
const ignores = new Ignores(ignorePaths, ROOT);

Promise.all(
  getNewFiles(ROOT, targets, ignores, LAST_UPDATE).map(async d => {
    await 0;
    log.info(`Sending file "${d}"..`, true);

    const file = new File(d);
    if (!file.mediaType) {
      log.err(`Not supported file type of ${d}`);
      return null;
    }

    let isClone = false;
    if (file.isJpeg) {
      try {
        const exif = new Exif(file.read().toString('binary'));
        if (!exif.getDateTime()) {
          const MODIFIED_PATH = file.path.replace(file.name, `__${file.name}`);

          exif.setDateTime(file.birthTime);
          file.write(exif.getJpegBinary(), MODIFIED_PATH);

          file.path = MODIFIED_PATH;
          isClone = true;
          log.info(`\t\tRewrite dateTime EXIF to ${file.name}`);
        }
      } catch (e) {
        log.err(`Failed to modify exif at ${file.path}\n\terr: ${e}`);
      }
    }

    return send(file, DELETE_AFTER_UPLOAD, request)
      .then(result => {
        log.info(`Upload is done "${d}"`, true);
        return result;
      })
      .catch(e => {
        log.err(`Failed send file: ${d}, because ${e}`);
        return file;
      })
      .finally(() => isClone && file.delete());
  })
).then(results => {
  const faileds = results.filter(v => v !== 200);
  log.info(`Tried ${results.length} files, failed ${faileds.length} files.`);

  faileds
    .filter(v => v !== null)
    .map(({ path, mode }) => {
      fs.chmodSync(path, mode);
    });

  prop.write({
    ...prop.value,
    LAST_UPDATE: new Date(),
  });

  if (faileds.length) {
    process.exit(1);
  } else {
    process.exit(0);
  }
});
