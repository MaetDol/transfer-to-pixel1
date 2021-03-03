const fs = require('fs');
const path = require('path');
const http = require('http');
const log = require('./utils/logger.js');
const PromisePool = require('./utils/PromisePool.js');
const File = require('./utils/File.js');

log.info( new Date() );
const promisePool = new PromisePool( 300 * 1024 * 1024 );
const propPath = path.resolve( __dirname, '../properties.json' );
const props = readProps( propPath );
const { 
  LAST_UPDATE,
  ROOT,
  SERVER,
  PORT,
  DELETE_AFTER_UPLOAD,
  targets
} = props;

setProps({...props, LAST_UPDATE: new Date()}, propPath );

Promise.all( getNewFiles(targets).map( async d => {
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


function readProps( path ){
  const propFile = fs.readFileSync( path, 'UTF-8' );
  if( !propFile ) throw 'properties.json is empty!';

  const props = JSON.parse( propFile );
  if( !props.targets.length ) throw 'There is no target directories for watching';

  props.LAST_UPDATE = new Date( props.LAST_UPDATE );
  return props;
}

function setProps( prop, path ){
  fs.writeFileSync( path, JSON.stringify(prop, null, 4) );
}

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
      log.err(`Upload "${file.name}", ${readableSize( file.size )}, but got an : ${code}`) 
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

