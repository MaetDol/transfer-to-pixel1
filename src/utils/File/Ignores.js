const Properties = require('../Properties');

class DirPattern {

  constructor( path ) {
    this.isRoot = path[0] === '/';
    this.path = path;
    this.paths = getPathes( path );
    this.root = this.isRoot 
      ? new Properties().value.ROOT
      : null;
  }

  isMatched( fullPathOfTarget ) {
    const targetPaths = getPathes( fullPathOfTarget );
    const ignoreItor = toIterator( this.paths );
    const targetItor = toIterator( targetPaths );

    const nextIgnore = () => ignoreItor.next().value;
    const nextTarget = () => targetItor.next().value;

    if( this.isRoot ) {
      return this.isIgnoredRootPath( targetPaths );
    }

    const result = this.checkMatch( nextIgnore, nextTarget, true );
    return result;
  }

  isIgnoredRootPath( targetPathes ) {
    const ignorePathes = this.paths;

    for( let i=0, j=0; i < ignorePathes.length; i++, j++) {
      const ignorePath = ignorePathes[i];
      if( ignorePath === '*' ) {
        continue;
      } 
      else if( ignorePath === '**' ) {
        return this.isIgnoredPartPath( 
          targetPathes.slice( j ),
          ignorePathes.slice( i + 1 )
        );
      } 
      else if( ignorePath !== targetPathes[j] ) {
        return false;
      }
    }
    return true;
  }

  isIgnoredPartPath( targetPathes, ignorePathes=this.paths ) {
    for( let i=0; i < targetPathes.length; i++ ) { 
      let start = i;
      let dismatch = false;
      for( let j=0; j < ignorePathes.length; j++, start++ ) {
        const ignore = ignorePathes[j];
        if( ignore === '*' ) {
          continue;
        }
        else if( ignore === '**' ) {
          const isIgnored = this.isIgnoredPartPath( 
            targetPathes.slice( i ),
            ignorePathes.slice( j + 1 ) 
          );
          if( isIgnored ) return true;
          else {
            dismatch = true;
            break;
          }
        }
        else if( ignore !== targetPathes[start] ) {
          dismatch = true;
          break;
        }
      }
      if( start >= ignorePathes.length && !dismatch ) return true;
    }
    return false;
  }

  checkMatch( nextIgnore, nextTarget, retryOnMismatch=false ) {

    let ignore;
    let target;

    while( true ) {
      target = nextTarget();
      ignore = nextIgnore();

      if( ignore === undefined ) return true;
      if( target === undefined ) return false;

      if( ignore === '*' ) continue;
      if( ignore === '**' ) {
        retryOnMismatch = true;
        const valid = checkMultipleWildPath(
          nextIgnore, target, nextTarget,
        );
        if( !valid ) return false;
        continue;
      }

      if( ignore !== target ) {
        if( !retryOnMismatch ) return false;
        while( target !== ignore ) {
          target = nextTarget();
          if( !target ) return false;
        }
      }
    }
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

/**
 * @description /를 기준으로 나눈 배열을 반환합니다
 * @param {string} fullPath 
 */
function getPathes( fullPath ) {
  const pathes = fullPath.split('/');
  return pathes.filter( p => p );
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
