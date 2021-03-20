const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const {
	rootPath,
	relativePath,
	delay,
	setProp,
} = require('./utils');

const {
  files1,
  files2,
  ignores,
  invalid,
  isValid,
  isIgnoredFile,
  createFile,
  wholeFiles,
} = require('./files');


describe('Test upload files that only valid', () => {
  const env = { name:[] };
  beforeAll( async () => {
    jest.resetModules();

    env.srcName = '__origin';
    env.src = rootPath( env.srcName );
    env.desName = '__received';
    env.des = rootPath( env.desName );

    fs.mkdirSync( env.src, {recursive: true} );
    fs.mkdirSync( env.des, {recursive: true} );

    files1.forEach( f => createFile(env.src, f) );

    await delay( 100 );
    env.prop = setProp({
      targets: [env.srcName],
      ignores: [],
      UPLOAD_DIR: env.desName,
    });
    await delay( 10 );

    files2.forEach( f => createFile(env.src, f) );
    invalid.forEach( f => createFile(env.src, f) );

    env.server = spawn( 'node', [relativePath('../src/server.js')] );
    await delay( 2000 );
  }, 20 * 1000 );

  afterAll(() => {
    fs.rmdirSync( env.src, {recursive: true} );
    fs.rmdirSync( env.des, {recursive: true} );
    env.server.kill( 'SIGINT' );
  });

  test('default upload test', done => {
    const client = spawn(
      'node', 
      [relativePath( '../src/client.js' )],
    );
    client.stdout.on( 'data', d => console.log(`${d}`) );

    client.on('close', () => {
      const uploadedFiles = fs
          .readdirSync( env.des, {withFileTypes: true} )
          .map( f => f.name );
      console.log( uploadedFiles );

      const uploaded = uploadedFiles.length === files2.length;
      const valid = uploadedFiles.every( isValid );

      console.log(
`
Expected upload count is ${files2.length}
Upload files are valid? ${valid}
Uploaded all valid files? ${uploaded}
`
      );
      expect( valid && uploaded ).toBeTruthy();
      done();
    });
  });


});
