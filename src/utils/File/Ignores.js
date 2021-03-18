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
  }

  includes( path ) {
    return this.patterns.some( pattern => pattern.isMatched(path) );
  }

  static parse( str ) {
    return new Pattern( str );
  }
}

module.exports = Ignores;
