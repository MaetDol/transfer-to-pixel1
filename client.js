const fs = require('fs');
const path = require('path');
const http = require('http');

const propPath = path.resolve( __dirname, './properties.json' );
const { 
  LAST_UPDATE,
  BASE_URL,
  SERVER,
  PORT,
  targets
} = readProps( propPath );

targets
  .map( d => lookupNewFile(path.join( BASE_URL, d )) )
  .flat()
  .forEach( send );

//setProps({ LAST_UPDATE: new Date(), BASE_URL, targets }, propPath );
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
  if( ext.match(/jpe?g|gif|png/bmp/tiff/i) ){
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
      console.log('Maybe successfuly done');
      console.log( data );
    });
  });

  req.on('error', e => {
    console.log('Got an error: ', e);
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


