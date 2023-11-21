const piexif = require('piexifjs');

const formatter = new Intl.DateTimeFormat('ko-kr', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

const getFormatParts = date => {
  const rawParts = formatter.formatToParts(date);

  return rawParts.reduce((parts, part) => {
    parts[part.type] = part.value;
    return parts;
  }, {});
};

const formatToExifDateTime = date => {
  const { year, month, day, hour, minute, second } = getFormatParts(date);

  return `${year}:${month}:${day} ${hour}:${minute}:${second}`;
};

class Exif {
  exif = {
    '0th': {},
    Exif: {},
    GPS: {},
    Interop: {},
    '1st': {},
    thumbnail: null,
  };
  jpgBinaryString = '';

  constructor(jpegBinaryString) {
    this.jpgBinaryString = jpegBinaryString;
    this.exif = piexif.load(jpegBinaryString);
  }

  getDateTime() {
    return (
      this.exif.Exif[piexif.ExifIFD.DateTimeOriginal] ??
      this.exif.Exif[piexif.ExifIFD.DateTimeDigitized]
    );
  }

  setDateTime(date) {
    const formattedDate = formatToExifDateTime(date);
    this.exif.Exif[piexif.ExifIFD.DateTimeOriginal] = formattedDate;
    this.exif.Exif[piexif.ExifIFD.DateTimeDigitized] = formattedDate;
  }

  getJpegBinary() {
    const exifStr = piexif.dump(this.exif);
    const bin = piexif.remove(this.jpgBinaryString);
    return Buffer.from(piexif.insert(exifStr, bin), 'binary');
  }
}

module.exports = Exif;
