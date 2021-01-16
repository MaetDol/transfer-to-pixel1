const http = require('http');
const fs = require('fs');
const path = require('path');
const log = require('./logger.js');

const {ROOT} = JSON.parse(fs.readFileSync(
  path.resolve( __dirname, './server.properties.json' ),
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

    if( !/image/.test(req.headers['content-type']) ){
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
        const image = Buffer.concat( data );
        const [, filePath] = req.headers['content-disposition'].match(/filename="(.+)"/);
        if( !filePath ){
          log.err('filename not provided');
          res.writeHead( 415 ).end();
          return;
        }
        saveImage( filePath, image );
      } catch(e) {
        log.err('Failed while save image ' + e);
        res.writeHead( 500 ).end();
        return;
      }

      res.writeHead( 200 ).end();
    });
  } catch(e) {
    log.err('Internal server error' + e);
    res.writeHead( 500 ).end();
  }
}).listen( 3000 );

log.info( 'Server is Running' );
log.info( new Date() );

function saveImage( filePath, image ){
  const [fileDir, name] = filePath.split( path.sep );
  const dir = path.resolve( ROOT, fileDir );
  if( !fs.existsSync(dir) ){
    fs.mkdirSync( dir );  
  }
  fs.appendFileSync( 
    path.resolve(dir, name), 
    image, 
    {flag: 'w'}
  );
}
