const fs = require('fs');
const path = require('path');

const {
  LOG_DIR,
  LOGGING,
  LOG_DISPLAY_ONLY,
  ROOT,
} = JSON.parse( fs.readFileSync(
  path.resolve( __dirname, './properties.json' ),
  'UTF-8',
));

const BASE = path.resolve( ROOT, LOG_DIR );
const INFO = 'INFO';
const ERROR = 'ERROR';

// TODO: write like 16.log file by each date
module.exports = {
  info: obj => {
    write( `[INFO] ${stringify( obj )}`, INFO );
  },
  err: obj => {
    write( `[ERROR] ${stringify( obj )}`, ERROR );
  }
};

function write( str, level ) {
  if( !LOGGING ) return;

  if( LOG_DISPLAY_ONLY === level ){
    console.log(`${str}\n`);
    return;
  }

  const { year, month, date }= now();
  const dirPath = path.resolve( BASE, `./${year}`);
  if( !fs.existsSync(dirPath) ){
    fs.mkdirSync( dirPath, { recursive: true });
  }

  fs.writeFileSync( 
    path.resolve( dirPath, `./${pad(month)}${pad(date)}.log` ),
    str + '\n', 
    {flag:'a'},
  );
  console.log( str );
}

function pad( v ){
  return v.toString().padStart(2, 0);
}

function now(){
  const date = new Date( new Date().getTime() + 9 * 60*60*1000 );
  return {
    year: date.getUTCDate(),
    month: date.getUTCMonth() + 1,
    date: date.getUTCDate(),
  };
}

function stringify( input ){
  if( typeof input === 'object' ) {
    return JSON.stringify( input, null, 2 );
  }
  return input;
}
