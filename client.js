const fs = require('fs');
const path = require('path');
const http = require('http');
const log = require('./logger.js');

const propPath = path.resolve( __dirname, './properties.json' );
const { 
  LAST_UPDATE,
  BASE_URL,
  SERVER,
  PORT,
  targets
} = props = readProps( propPath );

log.info('\n\n');
log.info( new Date() );
log.info('Start lookup new files');
const triedFiles = targets
  .map( d => {
    let newFiles = [];
    try {
      newFiles = lookupNewFile(path.join( BASE_URL, d ));
    } catch(e){
      log.err('Failed while lookup new file ' + e);
    }
    return newFiles;
  }).flat();

const failedFiles = triedFiles.filter( d => {
  try {
    log.info(`Sending file ${d}..`);
    send(d); 
  } catch(e){
    log.err(`Failed send file: ${d}, because ${e}`);
    return true;
  }
  return false;
});

log.info(`Tried ${triedFiles.length} files, failed ${failedFiles.length} files.`);
setProps({...props, LAST_UPDATE: new Date()}, propPath );
return 0;

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

function isNewer( target ){
  return LAST_UPDATE < target;
}

function contentTypeOf( ext ){
  if( ext.match(/jpe?g|gif|png|bmp|tiff/i) ){
    return 'image';
  }
  if( ext.match(/mp4[pv]?|mp3|webm|avi|wmv|/) ){
    return 'video';
  }

  throw 'Not supported file type';
}

function send( filePath ){
  const [lastDir, filename] = filePath.split( path.sep ).slice( -2 );
  const ext = path.extname( filename ).slice(1);
  const contentType = contentTypeOf( ext );

  const req = http.request({
    hostname: SERVER,
    method: 'POST',
    port: PORT,
    headers: {
      'Content-Type': `${contentType}/${ext}`,
      'Content-Disposition': `attachment; filename="${path.join( lastDir, filename )}"`,
    },
  }, res => {
    const data = [];
    res.on('data', d => data.push(d) );
    res.on('end', _=> {
      if( res.statusCode !== 200 ){
        log.err(`Tried ${filename}, but received invalid status code! ${res.statusCode}`);
      }
    });
  });

  req.on('error', e => {
    if( e ){
      console.log(e)
      log.err('Got an error: ', e);
    }
  });

  const file = fs.readFileSync( filePath );
  req.write( file );
  req.end();

}

function lookupNewFile( dir, result=[] ){

  fs.readdirSync( dir )
    .forEach( fp => {
      const fullPath = path.join( dir, fp );
      const stat = fs.statSync( fullPath );
      if( !isNewer(stat.ctime) ) return;

      if( stat.isDirectory() ){
        return lookupNewFile(fullPath, result);
      }

      result.push( fullPath );
    });

  return result;
}


