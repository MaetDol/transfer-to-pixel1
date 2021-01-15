const http = require('http');
const fs = require('fs');
const path = require('path');

function log( obj ) {
  console.log( JSON.stringify( obj, null, 2) )
}

http.createServer( (req, res) => {
   
  log( req.headers )
  log( req.method )

  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if( req.method.toUpperCase() === 'OPTIONS' ){
    res.end();
    return;
  }

  if( !/image/.test(req.headers['content-type']) ){
    log( 'invalid content-type' );
    res.writeHead( 400 ).end();
    return;
  }

  if( req.method.toUpperCase() !== 'POST' ){
    log( 'invalid method ' + req.method );
    res.writeHead( 405 ).end();
    return;
  }

  const data = [];
  req
    .on('data', d => data.push(d) )
    .on('end', _=> {
      try {
        const image = Buffer.concat( data );
        const [, filePath] = req.headers['content-disposition'].match(/filename="(.+)"/) || [];
        if( !filePath ){
          log('filename not provided');
          log(req.headers['content-disposition'])
          res.writeHead( 415 ).end();
          return;
        }
        saveImage( filePath, image );

      } catch(e) {
        res.writeHead( 500 ).end(e);
        log('Failed while save image ' + e);
        return;
      }
      res.writeHead( 200 ).end();
    });

}).listen( 3000 );

console.log( 'Running' );

function saveImage( filePath, data ){
  const [fileDir, name] = filePath.split( path.sep );
  const dir = path.resolve('./', fileDir);
  if( !fs.existsSync(dir) ){
    fs.mkdirSync( dir );  
  }
  fs.appendFileSync( 
    path.resolve(dir, name), 
    image, 
    {flag: 'w'}
  );
}
