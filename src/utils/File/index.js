module.exports = {
  File: require('./File'),
  ...require('./Ignores'),
  ...require('./Exif'),
  ...require('./FileUtils'),
};
