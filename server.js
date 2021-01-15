const http = require('http');
const fs = require('fs');

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
      const image = Buffer.concat( data );
      const [, filename] = req.headers['content-disposition'].match(/filename="(.+)"/) || [];
      if( !filename ){
        log('filename not provided');
        log(req.headers['content-disposition'])
        res.writeHead( 415 ).end();
        return;
      }
      fs.appendFileSync(`./${filename}`, image, {flag: 'w'});

      res.writeHead( 200 ).end();
    });

}).listen( 3000 );

console.log( 'Running' );
