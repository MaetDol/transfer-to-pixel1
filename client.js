const fs = require('fs');
const path = require('path');
const http = require('http');
const log = require('./logger.js');
const PromisePool = require('./promisePool.js');

log.info( new Date() );
const promisePool = new PromisePool( 300 * 1024 * 1024 );
const propPath = path.resolve( __dirname, './properties.json' );
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

Promise.all( getNewFiles(targets).map( d => {
  log.info(`Sending file "${d}"..`, true);
  return send(d)
    .finally(_=> log.info(`Upload is done "${d}"`, true))
    .catch( e => {
      log.err(`Failed send file: ${d}, because ${e}`);
      return d;
    });
}))
.then( results => {
  const faileds = results.filter( v => v !== null );
  log.info(`Tried ${results.length} files, failed ${faileds.length} files.`)

  faileds.map(({ filePath, mode })=> {
    fs.chmodSync( filePath, mode );
  });
});



function getNewFiles( dirs ){
  return dirs.map( d => {
    let newFiles = [];
    try {
      newFiles = lookupNewFile(path.join( ROOT, d ));
    } catch(e){
      log.err('Failed while lookup new file ' + e);
    }
    return newFiles;
  }).flat();
}

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

function contentTypeOf( ext ){
  if( ext.match(/jpe?g|gif|png|bmp|tiff/i) ){
    return 'image';
  }
  if( ext.match(/mp4[pv]?|mp3|webm|avi|wmv/i) ){
    return 'video';
  }

  throw 'Not supported file type';
}

async function send( filePath ){
  const filename = filePath.split( path.sep ).pop();
  const ext = path.extname( filename ).slice(1);
  const headers = {
    'Content-Type': `${contentTypeOf( ext )}/${ext}`,
    'Content-Disposition': `attachment; filename=\"${encodeURI(filename)}\"`,
  };

  const stat = fs.statSync( filePath );
  const size = stat.size;
  return promisePool
    .push( _=> {
      return asyncRequest(headers, fs.readFileSync(filePath));
    }, size)
    .then( _=> {
      if( DELETE_AFTER_UPLOAD ) fs.unlinkSync( filePath );
      return null;
    })
    .catch( code => {
      log.err(`Upload "${filename}", ${readableSize( size )}, but got an : ${code}`) 
      return {filePath, mode: stat.mode};
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

function lookupNewFile( dir, result=[] ){

  fs.readdirSync( dir )
    .forEach( fp => {
      const fullPath = path.join( dir, fp );
      const stat = fs.statSync( fullPath );
      if( LAST_UPDATE > stat.ctime ) return;

      if( stat.isDirectory() ){
        return lookupNewFile(fullPath, result);
      }

      result.push( fullPath );
    });

  return result;
}

function readableSize( size ){
  const SUFFIX_SET = ['B', 'KB', 'MB', 'GB', 'TB'];
  let suffix = 0;
  while( size >= 1024 ){
    size /= 1024;
    suffix++;
  }
  return `${size.toFixed(2)} ${SUFFIX_SET[suffix]}`;
}