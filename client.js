const fs = require('fs');
const path = require('path');

const baseUrl = '/storage/emulated/0/';
const lastUpdate = new Date('2021-01-13 17:00:00');
const targets = [
  'test',
];
console.log( targets.map(d => lookupNewFile(d)) );
return 0;

function isNewer( target ){
  return lastUpdate < target;
}

function send( path ){
  console.log( path );
}

function lookupNewFile( dir, result=[] ){

  fs.readdirSync( dir )
    .forEach( fp => {
      const fullPath = path.join( dir, fp );
      const stat = fs.statSync( fullPath );
      if( !isNewer(stat.ctime) ) return;

      if( stat.isDirectory() ){
        return lookupNewFile(fullPath, result);
      }

      result.push( fullPath );
    });

  return result;
}


