const fs = require('fs');
const path = require('path');
const log = require('./utils/logger.js');
const Properties = require('./utils/Properties.js');
const { File, Ignores, getNewFiles } = require('./utils/File');
const { send, createRequestFunction } = require('./utils/request.js');

log.info( new Date() );
const prop = new Properties(
  path.resolve( __dirname, '../properties.json' ),
);
const { 
  LAST_UPDATE,
  ROOT,
  SERVER,
  PORT,
  DELETE_AFTER_UPLOAD,
  targets,
  ignores: ignorePaths
} = prop.value;

prop.write({
  ...prop.value,
  LAST_UPDATE: new Date(),
});

const request = createRequestFunction( SERVER, PORT );
const ignores = new Ignores( ignorePaths, ROOT );

Promise.all( getNewFiles(ROOT, targets, ignores, LAST_UPDATE).map( async d => {
  await 0;
  log.info(`Sending file "${d}"..`, true);

  const file = new File(d);
  if( !file.mediaType ) {
    log.err(`Not supported file type of ${d}`);
    return null;
  }

  return send( file, DELETE_AFTER_UPLOAD, request )
    .finally(_=> log.info(`Upload is done "${d}"`, true))
    .catch( e => {
      log.err(`Failed send file: ${d}, because ${e}`);
      return file;
    });
}))
.then( results => {
  const faileds = results.filter( v => v !== 200 );
  log.info(`Tried ${results.length} files, failed ${faileds.length} files.`)

  faileds.filter(v => v !== null).map(({ path, mode })=> {
    fs.chmodSync( path, mode );
  });

  if( faileds.length ){
    process.exit(1);
  } else {
    process.exit(0);
  }
});

