const http = require('http');

function log( obj ) {
  console.log( JSON.stringify( obj, null, 2) )
}

http.createServer( (req, res) => {
   
  log( req.headers )

  if( req.headers['content-type'] !== 'multipart/form-data' ){
    log( 'invalid content-type ' + req.header['content-type'] );
    res.writeHead( 400 ).end();
    return;
  }

  if( req.method.toLowerCase() !== 'POST' ){
    log( 'invalid method ' + req.method );
    res.writeHead( 405 ).end();
    return;
  }

  let data = '';
  req
    .on('data', d => data += d )
    .on('end', _=> {
      log( 'Received data: ' + data );
    });

}).listen( 8080 );
