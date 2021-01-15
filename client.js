const fs = require('fs');
const path = require('path');

const propPath = path.resolve( __dirname, './properties.json' );
const { 
  LAST_UPDATE,
  BASE_URL,
  targets
} = readProps( propPath );

targets
  .map( d => lookupNewFile(path.join( BASE_URL, d )) )
  .flat()
  .forEach( send );

setProps({ LAST_UPDATE: new Date(), BASE_URL, targets }, propPath );
return 0;

function readProps( path ){
  const propFile = fs.readFileSync( path, 'UTF-8' );
  if( !propFile ) throw 'properties.json is empty!';

  const props = JSON.parse( propFile );
  if( !props.targets.length ) throw 'There is no target directories for watching';

  props.LAST_UPDATE = new Date( props.LAST_UPDATE );
  return props;
}

function setProps( prop, path ){
  fs.writeFileSync( path, JSON.stringify(prop, null, 4) );
}

function isNewer( target ){
  return LAST_UPDATE < target;
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


