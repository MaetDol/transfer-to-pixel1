const path = require('path');

const Properties = require('../src/utils/Properties');

function rootPath( p ) {
  return path.join( __dirname, p );
}

function relativePath( p ) {
  return path.resolve( __dirname, p );
}

function delay( time ) {
  return new Promise( resolve => setTimeout(resolve, time) );
}

function setProp( newProp ) {
  const prop = new Properties( relativePath('../properties.json') );

  prop.write({
    ...prop.value,

    SERVER: 'localhost',
    PORT: '9000',
    LAST_UPDATE: new Date(),

    targets: [
      '__origin',
    ],
    ignores: [
      '/ignore',
      '/.thumb',
    ],
    DELETE_AFTER_UPLOAD: false,

    ROOT: __dirname,
    UPLOAD_DIR: '__received',
    LOG_DIR: 'test_logs',
    LOGGING: true,

    ...newProp
  });

	return prop;
}

module.exports = {
	rootPath,
	relativePath,
	delay,
	setProp,
};