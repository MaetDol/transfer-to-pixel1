const fs = require('fs');
const path = require('path');

class File {
  constructor(filePath) {
    const stat = fs.statSync(filePath);
    this.name = filePath.split(path.sep).pop();
    this.ext = path.extname(this.name).slice(1);
    this.path = filePath;
    this.mediaType = this.mediaTypeOf();

    this.size = stat.size;
    this.mode = stat.mode;
    this.birthTime = Math.min(
      ...[
        stat.birthtime,
        stat.atime,
        stat.mtime,
        stat.ctime,
        new Date(),
      ].filter(t => t instanceof Date)
    );
  }

  mediaTypeOf() {
    if (this.ext.match(/jpe?g|gif|png|bmp|tiff|webp|rw2/i)) {
      return 'image';
    }
    if (this.ext.match(/mp4[pv]?|mp3|webm|avi|wmv|mov/i)) {
      return 'video';
    }
    return null;
  }

  read() {
    return fs.readFileSync(this.path);
  }

  readAsStream() {
    return fs.createReadStream(this.path);
  }

  write(data, as = this.path) {
    fs.writeFileSync(as, data);
  }

  readableSize() {
    const SUFFIX_SET = ['B', 'KB', 'MB', 'GB', 'TB'];
    let suffix = 0;
    let size = this.size;
    while (size >= 1024) {
      size /= 1024;
      suffix++;
    }
    return `${size.toFixed(2)} ${SUFFIX_SET[suffix]}`;
  }

  delete() {
    fs.unlinkSync(this.path);
  }

  isJpeg() {
    return /jpe?g/i.test(this.ext);
  }
}

module.exports = File;
