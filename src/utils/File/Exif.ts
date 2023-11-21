// @ts-ignore
import piexif from 'piexifjs';

const formatter = new Intl.DateTimeFormat('ko-kr', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

const getFormatParts = (date: Date) => {
  const rawParts = formatter.formatToParts(date);

  return rawParts.reduce((parts, part) => {
    parts[part.type] = part.value;
    return parts;
  }, {} as Record<Intl.DateTimeFormatPartTypes, string>);
};

const formatToExifDateTime = (date: Date) => {
  const { year, month, day, hour, minute, second } = getFormatParts(date);

  return `${year}:${month}:${day} ${hour}:${minute}:${second}`;
};

export class Exif {
  exif: {
    Exif: any;
  } = {
    Exif: {},
  };
  jpgBinaryString = '';

  constructor(jpegBinaryString: string) {
    this.jpgBinaryString = jpegBinaryString;
    this.exif = piexif.load(jpegBinaryString);
  }

  getDateTime() {
    return (
      this.exif.Exif[piexif.ExifIFD.DateTimeOriginal] ??
      this.exif.Exif[piexif.ExifIFD.DateTimeDigitized]
    );
  }

  setDateTime(date: Date) {
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
