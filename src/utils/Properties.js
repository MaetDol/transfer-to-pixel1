const fs = require('fs');

class Properties {
  constructor( path ) {
    this.path = path;
    this.read();
  }

  get value() {
    return this._prop;
  }

  read() {
    const propFile = fs.readFileSync( this.path, 'UTF-8' );
    if( !propFile ) throw 'properties.json is empty!';

    const prop = JSON.parse( propFile );
    if( !prop.targets.length ) throw 'There is no target directories for watching';

    prop.LAST_UPDATE = new Date( prop.LAST_UPDATE );
    this._prop = prop;
  }

  write( prop ) {
    this._prop = prop;
    fs.writeFileSync( 
      this.path, 
      JSON.stringify( prop, null, 4 ),
    );
  }
}

module.exports = Properties;
