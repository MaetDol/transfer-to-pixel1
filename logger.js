const fs = require('fs');
const path = require('path');

// TODO: write like 16.log file by each date
module.exports = {
  info: obj => {
    let content = stringify( obj );
    write( '[INFO] ' + content );
  },
  err: obj => {
    const content = stringify( obj );
    write( '[ERROR]' + content );
  }
};

function write( str ) {
  console.log( str );
}

function stringify( input ){
  if( typeof input === 'object' ) {
    return JSON.stringify( input, null, 2 );
  }
  return input;
}
