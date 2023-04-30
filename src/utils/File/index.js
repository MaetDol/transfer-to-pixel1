module.exports = {
  File: require('./File.js'),
  Ignores: require('./Ignores'),
  ...require('./FileUtils.js'),
  ...require('./exif.js'),
};
