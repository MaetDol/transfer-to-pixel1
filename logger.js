const fs = require('fs');
const path = require('path');

const {
  LOG_DIR,
  LOGGING,
} = JSON.parse( fs.readFileSync(
  path.resolve( __dirname, './server.properties.json' ),
  'UTF-8',
));

// TODO: write like 16.log file by each date
module.exports = {
  info: obj => {
    let content = stringify( obj );
    write( '[INFO] ' + content );
  },
  err: obj => {
    const content = stringify( obj );
    write( '[ERROR] ' + content );
  }
};

function write( str ) {
  if( !LOGGING ) return;

  const dirPath = path.resolve(LOG_DIR, './2021');
  if( !fs.existsSync(dirPath) ){
    fs.mkdirSync( dirPath );
  }

  fs.writeFileSync( 
    path.resolve( dirPath, './0117.log' ),
    str + '\n', 
    {flag:'a'},
  );
  console.log( str );
}

function stringify( input ){
  if( typeof input === 'object' ) {
    return JSON.stringify( input, null, 2 );
  }
  return input;
}
