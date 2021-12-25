class Pattern {
  constructor( path ) {
    this.isDir = path.slice(-1) === '/';
    this.isRoot = path[0] === '/';
    this.path = path.split('**');
  }

  isMatched( target ) {
    return false;
  }
  

}

class Ignores {
  constructor( list ) {
    this.patterns = list.map( Ignores.parse );
    this.dirPatterns = this.patterns.filter( p => p.isDir );
    this.filePatterns = this.patterns.filter( p => !p.isDir );
  }

  includes( path ) {
    return this
      .patterns
      .some( pattern => pattern.isMatched(path) );
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

  static parse( str ) {
    return new Pattern( str );
  }
}

class Ignores {
  constructor( pathes ) {
    this.pathes = pathes;
    this.dirPathes = this.parse(
      pathes.filter( p => p.slice(-1) === '/' )
    );
    this.filePathes = this.parse(
      pathes.filter( p => p.slice(-1) !== '/' )
    );
  }

  dir( path ) {
    return this.dirPathes.some( ignore => ignore.test(path) )
  }

  file( path ) {
    return this.filePathes.some( ignore => ignore.test(path) )
  }

  parse( pathes ) {
    return pathes.map( path => {
      let escapedPath = path.replace(
        /[.*+?^${}()|[\]\\]/g, 
        '\\$&'
      );

      const isStartFromRoot = /^\//.test( path );
      if( isStartFromRoot ) {
        escapedPath = '^' + escapedPath;
      }
      const isFile = path.slice(-1) !== '/';
      if( isFile ) {
        escapedPath += '$';
      }
      
      escapedPath = escapedPath.replace(/\/\\\*\//g, '/[^/]+/');
      escapedPath = escapedPath.replace(/\/\\\*\\\*\//g, '/([^/]+/)+');
      escapedPath = escapedPath.replace(/\\\*(?![\/*])/g, '[^/]*');

      return new RegExp( escapedPath );
    });
  }
}

module.exports = Ignores;
