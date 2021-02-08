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
    if( ext.match(/jpe?g|gif|png|bmp|tiff/i) ){
      return 'image';
    }
    if( ext.match(/mp4[pv]?|mp3|webm|avi|wmv/i) ){
      return 'video';
    }
    return null;
  }

  read(){
    return fs.readFileSync( this.path );
  }

  delete(){
    fs.unlinkSync( this.path );
  }
  
}

module.exports = File;
