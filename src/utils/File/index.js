module.exports = {
  File: require('./File'),
  ...require('./Ignores'),
  Exif: require('./Exif'),
  ...require('./FileUtils'),
};
