const fs = require('fs');
const path = require('path');
const http = require('http');
const log = require('./utils/logger.js');
const PromisePool = require('./utils/PromisePool.js');
const Properties = require('./utils/Properties.js');
const { File, Ignores, getNewFiles } = require('./utils/File');

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

const ignores = new Ignores( ignorePaths );
const promisePool = new PromisePool( 300 * 1024 * 1024 );

Promise.all( getNewFiles(targets, ignores).map( async d => {
  await 0;
  log.info(`Sending file "${d}"..`, true);

  const file = new File(d);
  if( !file.mediaType ) {
    log.err(`Not supported file type of ${d}`);
    return null;
  }

  return send( file )
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


async function send( file ){
  const headers = {
    'Content-Type': `${file.mediaType}/${file.ext}`,
    'Content-Disposition': `attachment; filename=\"${encodeURI(file.name)}\"`,
  };

  return promisePool
    .push( _=> asyncRequest(headers, file.read()), file.size)
    .then( code => {
      if( DELETE_AFTER_UPLOAD ) file.delete();
      return code;
    })
    .catch( code => {
      log.err(`Upload "${file.name}", ${file.readableSize()}, but got an : ${code}`) 
      return {path: file.path, mode: file.mode};
    });
}

function asyncRequest( header, content ){
  return new Promise(( resolve, reject ) => {
    const req = http.request({
      hostname: SERVER,
      method: 'POST',
      port: PORT,
      headers: header,
    }, res => {
      res.on('data', _=>0 );
      res.on('end', _=> {
        if( res.statusCode !== 200 ) reject( res.statusCode );
        resolve( res.statusCode );
      });
    });

    req.on('error', e => {
      if( e ) reject(e);
    });

    req.write( content );
    req.end();
  });
}

