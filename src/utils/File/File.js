const fs = require('fs');
const path = require('path');

class File {
  constructor( filePath ){
    const stat = fs.statSync( filePath );
    this.name = filePath.split( path.sep ).pop();
    this.ext = path.extname( this.name ).slice(1);
    this.path = filePath;
    this.mediaType = this.mediaTypeOf();

    this.size = stat.size;
    this.mode = stat.mode;
  }

  mediaTypeOf(){
    if( this.ext.match(/jpe?g|gif|png|bmp|tiff/i) ){
      return 'image';
    }
    if( this.ext.match(/mp4[pv]?|mp3|webm|avi|wmv/i) ){
      return 'video';
    }
    return null;
  }

  read(){
    return fs.readFileSync( this.path );
  }

  readableSize() {
    const SUFFIX_SET = ['B', 'KB', 'MB', 'GB', 'TB'];
    let suffix = 0;
    let size = this.size;
    while( size >= 1024 ){
      size /= 1024;
      suffix++;
    }
    return `${size.toFixed(2)} ${SUFFIX_SET[suffix]}`;
  }

  delete(){
    fs.unlinkSync( this.path );
  }
  
}

module.exports = File;
