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

module.exports = Ignores;
