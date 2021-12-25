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
