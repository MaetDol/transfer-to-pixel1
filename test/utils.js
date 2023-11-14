const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const Properties = require('../src/utils/Properties');
const { createFile } = require('./files');

function rootPath(p) {
  return path.join(__dirname, p);
}

function relativePath(p) {
  return path.resolve(__dirname, p);
}

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

function setProp(newProp) {
  const prop = new Properties(relativePath('../properties.json'));

  prop.write({
    ...prop.value,

    SERVER: 'localhost',
    PORT: '9000',
    LAST_UPDATE: new Date(),

    targets: ['__origin'],
    ignores: ['/ignore', '/.thumb'],
    DELETE_AFTER_UPLOAD: false,

    ROOT: __dirname,
    UPLOAD_DIR: '__received',
    LOG_DIR: 'test_logs',
    LOGGING: true,

    ...newProp,
  });

  return prop;
}

async function initEnvironment(env) {
  jest.resetModules();
  if (!env.src) {
    env.srcName = '__origin';
    env.src = rootPath(env.srcName);
  }
  if (!env.des) {
    env.desName = '__received';
    env.des = rootPath(env.desName);
  }

  fs.mkdirSync(env.src, { recursive: true });
  fs.mkdirSync(env.des, { recursive: true });

  if (env.oldFiles) {
    env.oldFiles.forEach(f => createFile(env.src, f));
  }

  await delay(100);
  env.prop = setProp({
    targets: [env.srcName],
    ignores: [...(env.ignores || '')],
    UPLOAD_DIR: env.desName,
  });
  await delay(10);

  if (env.newFiles) {
    env.newFiles.forEach(f => createFile(env.src, f));
  }

  env.server = spawn('node', [relativePath('../src/server.js')]);
  await delay(2000);
}

function cleanupEnvironment(env) {
  fs.rmdirSync(env.src, { recursive: true });
  fs.rmdirSync(env.des, { recursive: true });
  env.server.kill('SIGINT');
}

function runClient(env) {
  const client = spawn('node', [relativePath('../src/client.js')]);
  client.stderr.on('data', e => console.log(`Error on Client script: ${e}`));
  if (env.printLog) {
    client.stdout.on('data', d => console.log(`${d}`));
  }
  return client;
}

function uploadedFiles(env) {
  return fs.readdirSync(env.des, { withFileTypes: true }).map(f => f.name);
}

module.exports = {
  rootPath,
  relativePath,
  delay,
  setProp,
  initEnvironment,
  cleanupEnvironment,
  runClient,
  uploadedFiles,
};
