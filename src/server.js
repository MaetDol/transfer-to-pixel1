const http = require('http');
const fs = require('fs');
const path = require('path');
const log = require('./utils/logger.js');

const {ROOT, PORT, UPLOAD_DIR} = JSON.parse(fs.readFileSync(
  path.resolve( __dirname, '../properties.json' ),
  'UTF-8',
));
const UPLOAD = path.join( ROOT, UPLOAD_DIR );
if( !fs.existsSync(UPLOAD) ) {
  log.info(`Directory ${UPLOAD} is not exists. creating..`);
  fs.mkdirSync( UPLOAD, {recursive: true}); 
}

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
        const buffer = Buffer.concat( data );
        const [, encodedName] = req.headers['content-disposition'].match(/filename="(.+)"/);
        if( !encodedName ){
          log.err('filename not provided');
          res.writeHead( 415 ).end();
          return;
        }
        const name = decodeURI( encodedName );
        save( name, buffer );
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

function save( name, file ){
  fs.appendFileSync( 
    path.resolve(UPLOAD, name), 
    file, 
    {flag: 'w'}
  );
}
