const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const {
  files1,
  files2,
  ignores,
  isIgnoredFile,
  createFile,
} = require('./files');
const { create } = require('domain');

const Properties = require(
  path.resolve( __dirname, '../src/utils/Properties')
);

const prop = new Properties( 
  path.resolve( __dirname, '../properties.json' )
);

function rootPath( p ) {
  return path.join( __dirname, p );
}

function relativePath( p ) {
  return path.resolve( __dirname, p );
}

function delay( time ) {
  return new Promise( resolve => setTimeout(resolve, time) );
}

const env = { name:[] };
beforeEach( async () => {
  jest.resetModules();

  env.srcName = '__origin';
  env.src = rootPath( env.srcName );

  env.desName = '__received';
  env.des = rootPath( env.desName );

  fs.mkdirSync( env.src, {recursive: true} );
  fs.mkdirSync( env.des, {recursive: true} );

  files1.forEach( f => createFile(env.src, f) );

  await delay( 10 );
  prop.write({
    ...prop.value,
    SERVER: 'localhost',
    PORT: '9000',
    LAST_UPDATE: new Date(),

    targets: [env.srcName],
    ignores: [],
    DELETE_AFTER_UPLOAD: false,

    ROOT: __dirname,
    UPLOAD_DIR: env.desName,
    LOG_DIR: 'test_logs',
    LOGGING: true,
  });
  
  await delay( 10 );
  files2.forEach( f => createFile(env.src, f) );

  env.server = spawn( 'node', [relativePath('../src/server.js')] );
  await delay( 1000 );
});

afterAll(() => {
  fs.rmdirSync( env.src, {recursive: true} );
  fs.rmdirSync( env.des, {recursive: true} );
  env.server.kill( 'SIGINT' );
});

test('Test without delete', done => {
  const client = spawn(
    'node', 
    [relativePath( '../src/client.js' )],
  );
  client.stdout.on( 'data', d => console.log(`${d}`) );
  client.on('close', () => {
    const uploadedFiles = fs.readdirSync( env.des, {withFileTypes: true} );
    console.log( uploadedFiles );
    done();
  });
});

