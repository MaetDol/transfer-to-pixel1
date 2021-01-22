const http = require('http');
const fs = require('fs');
const path = require('path');
const log = require('./logger.js');

const {SERVER_ROOT: ROOT, PORT} = JSON.parse(fs.readFileSync(
  path.resolve( __dirname, './properties.json' ),
  'UTF-8',
));

http.createServer( (req, res) => {
  try {
    log.info( '\n' );
    log.info( new Date() );
    log.info( req.headers );
    log.info( req.method );

    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if( req.method.toUpperCase() === 'OPTIONS' ){
      res.end();
      return;
    }

    if( !/image|video|audio/.test(req.headers['content-type']) ){
      log.err( 'invalid content-type' );
      res.writeHead( 400 ).end();
      return;
    }

    if( req.method.toUpperCase() !== 'POST' ){
      log.err( 'invalid method' );
      res.writeHead( 405 ).end();
      return;
    }

    const data = [];
    req.on('data', d => data.push(d) );
    req.on('end', _=> {
      try {
        const file = Buffer.concat( data );
        const [, encodedName] = req.headers['content-disposition'].match(/filename="(.+)"/);
        if( !encodedName ){
          log.err('filename not provided');
          res.writeHead( 415 ).end();
          return;
        }
        const filename = decodeURI( encodedName );
        save( filename, file );
      } catch(e) {
        log.err('Failed while save file ' + e);
        res.writeHead( 500 ).end();
        return;
      }

      res.writeHead( 200 ).end();
    });
  } catch(e) {
    log.err('Internal server error ' + e);
    res.writeHead( 500 ).end();
  }
}).listen( PORT );

log.info( 'Server is Running' );
log.info( new Date() );

function save( filename, file ){
  log.info( filename )
  const name = path.basename( filename );
  const dir = path.resolve( ROOT, path.dirname(filename) );
  log.info( dir );
  if( !fs.existsSync(dir) ){
    fs.mkdirSync( dir );  
  }
  fs.appendFileSync( 
    path.resolve(dir, name), 
    file, 
    {flag: 'w'}
  );
}
