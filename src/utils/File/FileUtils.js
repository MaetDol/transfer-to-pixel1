const fs = require('fs');
const path = require('path');
const log = require('../logger.js');

function lookupNewFile( dir, ignore, LAST_UPDATE ){
  const result = [];
  const dirs = [dir];
  while( dirs.length ) {
    const currentDir = dirs.pop();
    if( ignore.includes(currentDir) ) continue;

    fs
      .readdirSync( currentDir )
      .forEach( name => {
        const fullPath = path.join( currentDir, name );
        if( ignore.includes(fullPath) ) return;

        const stat = fs.statSync( fullPath );
        if( stat.isDirectory() ) {
          dirs.push( fullPath );
          return;
        }
        if( LAST_UPDATE > stat.ctime ) return;

        result.push( fullPath );
      });
  }

  return result;
}

function contentTypeOf( ext ){
  if( ext.match(/jpe?g|gif|png|bmp|tiff/i) ){
    return 'image';
  }
  if( ext.match(/mp4[pv]?|mp3|webm|avi|wmv/i) ){
    return 'video';
  }
}

function getNewFiles( ROOT, dirs, ignores, LAST_UPDATE){
  return dirs.map( d => {
    let newFiles = [];
    try {
      newFiles = lookupNewFile( path.join(ROOT, d), ignores, LAST_UPDATE );
    } catch(e){
      log.err('Failed while lookup new file ' + e);
    }
    return newFiles;
  }).flat();
}

module.exports = {
  lookupNewFile,
  contentTypeOf,
  getNewFiles,
};
