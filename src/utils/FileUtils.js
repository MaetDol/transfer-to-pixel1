
function readableSize( size ){
  const SUFFIX_SET = ['B', 'KB', 'MB', 'GB', 'TB'];
  let suffix = 0;
  while( size >= 1024 ){
    size /= 1024;
    suffix++;
  }
  return `${size.toFixed(2)} ${SUFFIX_SET[suffix]}`;
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

function contentTypeOf( ext ){
  if( ext.match(/jpe?g|gif|png|bmp|tiff/i) ){
    return 'image';
  }
  if( ext.match(/mp4[pv]?|mp3|webm|avi|wmv/i) ){
    return 'video';
  }
}

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

module.exports = {
  readableSize,
  lookupNewFile,
  contentTypeOf,
  getNewFiles,
};
