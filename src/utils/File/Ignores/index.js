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
    const escape = part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const singleAsterisk = part => part.replace(/^\*$/, '[^/]+');
    const doubleAsterisk = part => part.replace(/^\*{2}$/, '([^/]+/?)+');
    const asteriskInText = part => part.replace(
      /([^*]*)\*([^*]+)|([^*]+)\*([^*]*)/, 
      (match, group1, group2) => escape(group1) + '[^/]*' + escape(group2)
    );
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
        const escapeSingleAsterisk = singleAsterisk( parts[i] );
        if( escapeSingleAsterisk !== parts[i] ) {
          parts[i] = escapeSingleAsterisk;
          continue;
        }
        const escapeDoubleAsterisk = doubleAsterisk( parts[i] );
        if( escapeDoubleAsterisk !== parts[i] ) {
          parts[i] = escapeDoubleAsterisk;
          continue;
        }
        const escapeAsteriskInText = asteriskInText( parts[i] );
        if( escapeAsteriskInText !== parts[i] ) {
          parts[i] = escapeAsteriskInText;
          continue;
        }
        parts[i] = escape( parts[i] );
      }
      
      return new RegExp( parts.join('/') );
    });
  }
}

module.exports = Ignores;
