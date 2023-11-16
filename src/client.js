const fs = require('fs');
const path = require('path');
const log = require('./utils/logger.js');
const Properties = require('./utils/Properties.js');
const { File, Ignores, getNewFiles, Exif } = require('./utils/File');
const { send, createRequestFunction } = require('./utils/request.js');

log.info(new Date());
const prop = new Properties();
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

    const file = new File(d);
    if (!file.mediaType) {
      log.err(`Not supported file type of ${d}`);
      return null;
    }

    // jpeg EXIF 에 timestamp 가 없을 경우,
    // File birthtime 으로 exif 를 설정한 복사본 이미지를 만듭니다
    let isCloned = false;
    try {
      if (file.isJpeg() && !hasTimestamp(file)) {
        isCloned = rewriteTimestamp(file);
      }
    } catch (e) {
      log.err(`Failed to check exif timestamp while ${file.path}\n\terr: ${e}`);
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
      .finally(() => isCloned && file.delete());
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

function hasTimestamp(file) {
  const exif = new Exif(file.read().toString('binary'));
  return exif.getDateTime() !== undefined;
}

function rewriteTimestamp(file) {
  try {
    const exif = new Exif(file.read().toString('binary'));
    exif.setDateTime(file.birthTime);

    const MODIFIED_PATH = file.path.replace(file.name, `__${file.name}`);
    file.write(exif.getJpegBinary(), MODIFIED_PATH);
    file.path = MODIFIED_PATH;

    log.info(`\t\tRewrite dateTime EXIF to ${file.name}`);

    return true;
  } catch (e) {
    log.err(`Failed to modify exif at ${file.path}\n\terr: ${e}`);
  }

  return false;
}
