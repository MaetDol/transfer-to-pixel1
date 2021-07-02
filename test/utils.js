const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const Properties = require('../src/utils/Properties');
const { createFile } = require('./files');

/**
 * `/test` 디렉터리를 루트로 경로를 join 합니다
 * @param {string} p 디렉터리 또는 파일 명
 */
function rootPath( p ) {
  return path.join( __dirname, p );
}

/**
 * `/test` 디렉터리를 루트로 경로를 resolve 합니다
 * @param {string} p 디렉터리 또는 파일 명
 */
function relativePath( p ) {
  return path.resolve( __dirname, p );
}

/**
 * `time` 시간 후 `resolve` 하는 Promise를 반환합니다
 * @param {number} time 밀리세컨드
 */
function delay( time ) {
  return new Promise( resolve => setTimeout(resolve, time) );
}

/**
 * properties.json 파일을 테스트 환경 및 `newProp`으로 수정합니다
 * 그 후 새로 바뀐 prop을 반환합니다
 * @param {object} newProp
 * @returns {object} 
 */
function setProp( newProp ) {
  const prop = new Properties();

  prop.write({
    ...prop.value,

    SERVER: 'localhost',
    PORT: '9000',
    LAST_UPDATE: new Date(),

    targets: [
      '__origin',
    ],
    ignores: [
      '/ignore',
      '/.thumb',
    ],
    DELETE_AFTER_UPLOAD: false,

    ROOT: __dirname,
    UPLOAD_DIR: '__received',
    LOG_DIR: 'test_logs',
    LOGGING: true,

    ...newProp
  });

	return prop;
}

/**
 * 테스트를 돌기 전 `src`, `des`의 위치에 폴더를 만들고 `oldFiles`와 `newFiles`에 
 * 해당하는 파일들을 생성합니다. 그리고 그에 맞게 `env.props`를 설정합니다
 * @param {object} env 테스트를 진행하며 유지할 객체
 */
async function initEnvironment( env ) {
  jest.resetModules();
  if( !env.src ) {
    env.srcName = '__origin';
    env.src = rootPath( env.srcName );
  }
  if( !env.des ) {
    env.desName = '__received';
    env.des = rootPath( env.desName );
  }

  fs.mkdirSync( env.src, {recursive: true} );
  fs.mkdirSync( env.des, {recursive: true} );

  if( env.oldFiles ) {
    env.oldFiles.forEach( f => createFile(env.src, f) );
    await delay( 30 );
  }

  env.prop = setProp({
    targets: [env.srcName],
    ignores: [...(env.ignores || '')],
    UPLOAD_DIR: env.desName,
  });

  if( env.newFiles ) {
    await delay( 30 );
    env.newFiles.forEach( f => createFile(env.src, f) );
  }

  let isReady = false;
  let resolver = null;
  const promise = new Promise( resolve => resolver = resolve );
  env.server = spawn( 'node', [relativePath('../src/server.js')] );
  env.server.stdout.on( 'data', data => {
    if( env.printLog ) env.printLog( `SERVER: ${data}` );
    if( isReady ) return;
    isReady = true;
    resolver();
  });

  return promise;
}

/**
 * 테스트로 생성한 업로드/다운로드 폴더를 지우고 가동중인 서버를 종료합니다
 * @param {object} env 테스트동안 전역으로 사용된 객체
 */
function cleanupEnvironment( env ) {
    fs.rmdirSync( env.src, {recursive: true} );
    fs.rmdirSync( env.des, {recursive: true} );
    env.server.kill( 'SIGINT' );
}

function runClient( env ) {
  const client = spawn(
    'node', 
    [relativePath( '../src/client.js' )],
  );
  if( env.printLog ) {
    client.stdout.on( 'data', d => env.printLog(`CLIENT: ${d}`) );
  }
  return client;
}

function uploadedFiles( env ) {
  return fs
    .readdirSync( env.des, {withFileTypes: true} )
    .map( f => f.name );
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