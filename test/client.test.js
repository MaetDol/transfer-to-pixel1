const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const {
	rootPath,
	relativePath,
	delay,
	setProp,
  initEnvironment,
  cleanupEnvironment,
  runClient,
  uploadedFiles,
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
  contains,
} = require('./files');

describe('Upload valid files only', () => {
  const env = {
    oldFiles: files1,
    newFiles: [].concat( files2, invalid ),
  };

  beforeAll( () => initEnvironment(env), 20 * 1000 );
  afterAll( () => cleanupEnvironment(env) );

  test('upload files2..', done => {
    runClient( env ).on('close', () => {
      const files = uploadedFiles( env );
      const uploaded = files.length === files2.length;
      const valid = files.every( f => contains(f, files2) );

      expect( valid && uploaded ).toBeTruthy();
      done();
    });
  });
});

describe('Upload without ignore files', () => {
  const env = {
    printLog: false,
    oldFiles: files1,
    newFiles: [].concat( files2, invalid, ignores ),
    ignores: ['/__origin/ignore/', '.*/'],
  };

  beforeAll( () => initEnvironment(env), 20 * 1000 );
  afterAll( () => cleanupEnvironment(env) );

  test('upload files2..', done => {
    runClient( env ).on('close', () => {
      const files = uploadedFiles( env );
      const uploaded = files.length === files2.length;
      const valid = files.every( f => contains(f, files2) );

      expect( valid && uploaded ).toBeTruthy();
      done();
    });
  });
});