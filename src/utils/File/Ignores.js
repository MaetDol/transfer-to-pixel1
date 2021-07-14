const Properties = require('../Properties');

class DirPattern {

  constructor( path ) {
    this.isRoot = path[0] === '/';
    this.path = path;
    this.paths = path.split( '/' ).slice( 0, -1 );
    this.root = this.isRoot 
      ? new Properties().value.ROOT
      : null;
  }

  isMatched( fullPathOfTarget ) {
    const targetPaths = fullPathOfTarget.split( '/' );
    const ignoreItor = toIterator( this.paths );
    const targetItor = toIterator( targetPaths );
  
    const nextIgnore = () => ignoreItor.next().value;
    const nextTarget = () => targetItor.next().value;

    let ignore;
    let target;
    let hasWildcard = false;
    while( this.isRoot && true ) {
      target = nextTarget();
      ignore = nextIgnore();

      if( ignore === undefined ) return true;
      if( target === undefined ) return false;

      if( ignore === '*' ) continue;
      if( ignore === '**' ) {
        hasWildcard = true;
        const valid = checkMultipleWildPath(
          nextIgnore, target, nextTarget,
        );
        if( !valid ) return false;
        continue;
      }

      if( ignore !== target ) {
        if( !hasWildcard ) return false;
        while( target !== ignore ) {
          target = nextTarget();
          if( !target ) return false;
        }
      }
    }
    return false;
  }
}

function checkMultipleWildPath( nextIgnore, target, nextTarget ) {
  const ignore = nextIgnore();
  if( ignore === undefined ) return true;

  while( ignore !== target ) {
    target = nextTarget();
    if( !target ) return false;
  }
  return ignore;
}

function* toIterator(arr) {
  for( const item of arr ) {
    yield item;
  }
}

class FilePattern {
  constructor( path ) {

  }

  isMathced() {
    return false;
  }
}

class Ignores {
  constructor( list ) {
    const patterns = list.map(
      p => p.slice( -1 ) === '/' 
        ? new DirPattern( p )
        : new FilePattern( p )
    );
    this.dirPatterns = patterns.filter( p => p instanceof DirPattern );
    this.filePatterns = patterns.filter( p => p instanceof FilePattern );
  }

  dir( dirName ) {
    return this
      .dirPatterns
      .some( pattern => pattern.isMatched(dirName) );
  }

  file( fileName ) {
    return this
      .filePatterns
      .some( pattern => pattern.isMatched(fileName) );
  }
}


module.exports = Ignores;
