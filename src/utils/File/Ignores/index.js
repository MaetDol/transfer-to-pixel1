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
    const escapeRegExp = part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const singleAsterisk = part => part.replace(/^\*$/, '[^/]+');
    const doubleAsterisk = part => part.replace(/^\*{2}$/, '([^/]+/?)+');
    const asteriskInText = part => part.replace(
      /([^*]*)\*([^*]+)|([^*]+)\*([^*]*)/, 
      (_, group1, group2) => escapeRegExp(group1) + '[^/]*' + escapeRegExp(group2)
    );
    const escape = part => {
      const escapeSingleAsterisk = singleAsterisk( part );
      if( escapeSingleAsterisk !== part ) {
        return escapeSingleAsterisk;
      }
      const escapeDoubleAsterisk = doubleAsterisk( part );
      if( escapeDoubleAsterisk !== part ) {
        return escapeDoubleAsterisk;
      }
      const escapeAsteriskInText = asteriskInText( part );
      if( escapeAsteriskInText !== part ) {
        return escapeAsteriskInText;
      }
      return escapeRegExp( part );
    }
    
    return pathes.map( path => {
      const parts = path.split('/');

      const isStartFromRoot = parts[0] === '';
      if( isStartFromRoot ) {
        parts[0] = '^';
      }
      const lastPart = parts[parts.length-1];
      const isFile = lastPart !== '';
      if( isFile ) {
        parts[parts.length-1] = escape( lastPart ) + '$';
      }

      for( let i=1; i < parts.length-1; i++ ) {
        parts[i] = escape( parts[i] );
      }
      
      return new RegExp( parts.join('/') );
    });
  }
}

module.exports = Ignores;
