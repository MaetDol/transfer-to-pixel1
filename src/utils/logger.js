const fs = require('fs');
const path = require('path');
const Properties = require('./Properties');

const {
  LOG_DIR,
  LOGGING,
  ROOT,
} = new Properties().value;
const BASE = path.join( ROOT, LOG_DIR );

module.exports = {
  info: (obj, isDisplayOnly) => {
    write( `[INFO] ${stringify( obj )}`, isDisplayOnly );
  },
  err: (obj, isDisplayOnly) => {
    write( `[ERROR] ${stringify( obj )}`, isDisplayOnly );
  }
};

function write( str, displayOnly ) {
  if( !LOGGING ) return;

  if( displayOnly ){
    console.log(`${str}`);
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
    year: date.getUTCFullYear(),
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
