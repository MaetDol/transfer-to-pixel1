const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const Properties = require(
  path.resolve( __dirname, '../src/utils/Properties')
);

const prop = new Properties( 
  path.resolve( __dirname, '../properties.json' )
);

function delay( time ) {
  return new Promise( resolve => setTimeout(resolve, time) );
}

const env = { name:[] };
function createFile( dir, name ) {
  env.files.push( name );
  fs.writeFileSync( path.resolve(dir, name), '');
}

beforeEach( async () => {
  jest.resetModules();

  env.srcName = '__origin';
  env.src = path.join( __dirname, env.srcName );

  env.desName = '__received';
  env.des = path.join( __dirname, env.desName );

  if( !fs.existsSync(env.src) ) fs.mkdirSync( env.src );
  if( !fs.existsSync(env.des) ) fs.mkdirSync( env.des );

  createFile( env.src, 'oldFile.jpg' );
  createFile( env.src, 'oldFile2.png' );

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
    LOGGING: true,
  });
  
  await delay( 10 );
  createFile( env.src, 'newFile.jpeg' );
  createFile( env.src, 'newFile2.mp4' );

  env.server = spawn( 'node', [path.resolve(__dirname, '../src/server.js')] );
  await delay( 1000 );
});

afterAll(() => {
  fs.rmdirSync( env.src, {recursive: true} );
  fs.rmdirSync( env.des, {recursive: true} );
});

test('Test without delete', done => {
  const client = spawn(
    'node', 
    [path.resolve(__dirname, '../src/client.js')],
    {stdio: ['pipe', 'pipe', 'pipe', 'pipe', 'pipe']},
  );
  client.stdout.on( 'data', d => console.log(`ERROR ${d}`) );
  client.on('close', code => {
    const list = fs.readdirSync(env.des, {withFileTypes: true});
    list.forEach( l => console.log(l) );
    done();
  });
});

