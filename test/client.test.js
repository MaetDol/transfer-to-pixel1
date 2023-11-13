const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const piexif = require('piexifjs');

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
const { File, Exif } = require('../src/utils/File');

describe('Upload valid files only', () => {
  const env = {
    oldFiles: files1,
    newFiles: [].concat(files2, invalid),
  };

  beforeAll(() => initEnvironment(env), 20 * 1000);
  afterAll(() => cleanupEnvironment(env));

  test('upload files2..', done => {
    runClient(env).on('close', () => {
      const files = uploadedFiles(env);
      const uploaded = files.length === files2.length;
      const valid = files.every(f => contains(f, files2));

      expect(valid && uploaded).toBeTruthy();
      done();
    });
  });
});

describe('Upload without ignore files', () => {
  const env = {
    printLog: false,
    oldFiles: files1,
    newFiles: [].concat(files2, invalid, ignores),
    ignores: ['/__origin/ignore/', '.*/'],
  };

  beforeAll(() => initEnvironment(env), 20 * 1000);
  afterAll(() => cleanupEnvironment(env));

  test('upload files2..', done => {
    runClient(env).on('close', () => {
      const files = uploadedFiles(env);
      const uploaded = files.length === files2.length;
      const valid = files.every(f => contains(f, files2));

      expect(valid && uploaded).toBeTruthy();
      done();
    });
  });
});

describe('Modify EXIF timestamp', () => {
  const env = {
    printLog: false,
    oldFiles: [],
    newFiles: [],
  };

  beforeAll(() => initEnvironment(env), 20 * 1000);
  afterAll(() => cleanupEnvironment(env));

  test('파일 birthtime 기반 EXIF timestamp 추가 확인', done => {
    // given
    const imageName = 'dummy.jpg';
    const dummy = new File(relativePath(`./${imageName}`));
    const originalExif = new Exif(dummy.read().toString('binary'));

    // when
    originalExif.exif.Exif[piexif.ExifIFD.DateTimeOriginal] = undefined;
    originalExif.exif.Exif[piexif.ExifIFD.DateTimeDigitized] = undefined;

    const createdFilePath = relativePath(`./__origin/${imageName}`);
    dummy.write(originalExif.getJpegBinary(), createdFilePath);

    const createdFile = new File(createdFilePath);
    originalExif.setDateTime(new Date(createdFile.birthTime));

    runClient(env).on('close', () => {
      const uploadedFile = new File(relativePath(`./__received/${imageName}`));
      const uploadedExif = new Exif(uploadedFile.read().toString('binary'));

      // then
      expect(uploadedExif.getDateTime()).toBe(originalExif.getDateTime());
      done();
    });
  });

  test('EXIF timestamp 가 있을 경우 생략', done => {
    // given
    const imageName = 'dummy.jpg';
    const dummy = new File(relativePath(`./${imageName}`));
    const originalExif = new Exif(dummy.read().toString('binary'));

    // when
    originalExif.setDateTime(new Date('2023-01-01'));
    const targetTimestamp = originalExif.getDateTime();

    const createdFilePath = relativePath(`./__origin/${imageName}`);
    dummy.write(originalExif.getJpegBinary(), createdFilePath);

    runClient(env).on('close', () => {
      const uploadedFile = new File(relativePath(`./__received/${imageName}`));
      const uploadedExif = new Exif(uploadedFile.read().toString('binary'));

      // then
      expect(uploadedExif.getDateTime()).toBe(targetTimestamp);
      done();
    });
  });
});
