const http = require('http');

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

  let data = '';
  req
    .on('data', d => data += d )
    .on('end', _=> {
      const keys = Object.keys( data );

      res.writeHead( 200, {'Content-type': 'image/png'}).end( data );
    });

}).listen( 3000 );

console.log( 'Running' );
