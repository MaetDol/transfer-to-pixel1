import { describe, expect, it, jest } from '@jest/globals';
import fs from 'fs';
import { sep } from 'path';
import { PropertiesJson } from '../src/utils/Properties';
// @ts-ignore
import { send } from '../src/utils/request';

jest.mock('fs');
jest.mock('http');

jest.mock('../src/utils/logger', () => ({
  info: console.log,
  err: console.warn,
}));
jest.mock('../src/utils/request');

describe('Upload', () => {
  it(
    'Upload media files that were updated after LAST_UPDATE',
    async () => {
      console.log('---------------------------------------------');
      // Mocking..

      // fs
      // SKIP: chmodSync
      // DONE: statSync
      // DONE: readFileSync
      // DONE: createReadStream
      // SKIP: writeFileSync
      // SKIP: unlinkSync
      // DONE: readdirSync

      // Exif, File, Ignores, getNewFiles
      // DONE: Properties
      // DONE: log
      // createRequestFunction, send
      const mockedFs = jest.mocked(fs);
      mockedFs.statSync.mockImplementation(((path: string): fs.Stats => {
        return {
          // atime: new Date(),
          atimeMs: 0,
          // birthtime: new Date(),
          birthtimeMs: 0,
          blksize: 0,
          blocks: 0,
          // ctime: new Date(),
          ctimeMs: 0,
          dev: 0,
          gid: 0,
          ino: 0,
          // mode: 0,
          // mtime: new Date(),
          mtimeMs: 0,
          nlink: 0,
          rdev: 0,
          // size: 0,
          uid: 0,
          isFile: () => false,
          // isDirectory: () => false,
          isBlockDevice: () => false,
          isCharacterDevice: () => false,
          isSymbolicLink: () => false,
          isFIFO: () => false,
          isSocket: () => false,

          ...getFileSystemByPath(path, fileTree).stat,
        };
      }) as typeof fs.statSync);

      mockedFs.readFileSync.mockImplementation(((
        path: string
      ): string | Buffer => {
        const PROPS_JSON_PATH = process.env.TTP_APP_PROPERTIES_FILE_PATH;
        if (!PROPS_JSON_PATH) {
          throw 'TTP_APP_PROPERTIES_FILE_PATH env not found';
        }

        const PROPS_JSON_FILENAME = PROPS_JSON_PATH.slice(
          PROPS_JSON_PATH.lastIndexOf('/') + 1
        );

        if (path.includes(PROPS_JSON_FILENAME)) {
          return createClientPropertiesJson({
            ROOT: 'ROOT',
            targets: ['/target'],
            LAST_UPDATE: LAST_UPDATE.toISOString(),
          });
        }

        return Buffer.from(path);
      }) as typeof fs.readFileSync);

      mockedFs.readdirSync.mockImplementation(((path: string): string[] => {
        const targetDirectory = getFileSystemByPath(path, fileTree);

        if (isDirectory(targetDirectory)) {
          return Object.keys(targetDirectory.files);
        }

        throw `${targetDirectory.name} is not a directory`;
      }) as typeof fs.readdirSync);

      const LAST_UPDATE = new Date();

      // Given
      const oldFiles: FileSystemMock[] = ['old.jpg', 'old.mp4', 'old.png']
        .map(name => createFileMock(name))
        .map(file => {
          // 파일 생성 시점을 5분 전으로 설정
          file.stat.birthtime = new Date(LAST_UPDATE.getTime() - 1000 * 60 * 5);
          return file;
        });
      const newFiles: FileSystemMock[] = [
        'img.jpg',
        'img2.jpeg',
        'vdo.mp4',
      ].map(name => createFileMock(name));
      const fileTree: FileSystemMock = createDirectoryMock({
        name: 'ROOT',
        childs: [
          createDirectoryMock({
            name: 'target',
            childs: [
              ...newFiles,
              ...oldFiles,
              createDirectoryMock({
                name: 'more-depth',
                childs: [createFileMock('hidMediaFile.jpg')],
              }),
            ],
          }),
        ],
      });

      // When
      console.log('start client');
      await import('../src/client');

      // Then
      expect(true).toBeTruthy();
      console.log(send.mock.calls);
    },
    10 * 1000
  );
});

function getFileSystemByPath(
  path: string,
  dir: FileSystemMock
): FileSystemMock {
  // 맨 앞 '/' 는 제외하고, depth 별로 분리

  const [root, ...paths] = path
    .replace(new RegExp(`^\\${sep}+`), '')
    .split(sep);

  // check root
  if (root !== dir.name) {
    throw `Can not found root directory ${root}`;
  }

  for (const p of paths) {
    if (!isDirectory(dir)) throw `${p} is not a directory`;

    dir = dir.files[p];
    if (!dir) throw `Failed to read ${p}: not found`;
  }
  return dir;
}

function createClientPropertiesJson(value?: Partial<PropertiesJson>): string {
  return JSON.stringify({
    ROOT: '',
    LOGGING: false,
    LOG_DIR: '/log',

    SERVER: '',
    PORT: '0000',

    LAST_UPDATE: new Date().toString(),
    targets: [],
    ignores: [],
    DELETE_AFTER_UPLOAD: false,

    UPLOAD_DIR: '/upload',
    ...value,
  });
}
type FileMock = {
  name: string;
  files?: undefined;
  stat: {
    size: number;
    mode: number;
    birthtime: Date;
    atime: Date;
    mtime: Date;
    ctime: Date;
    isDirectory: () => false;
  };
};
type DirectoryMock = {
  name: string;
  files: { [filename: string]: FileSystemMock };
  stat: {
    size: number;
    mode: number;
    birthtime: Date;
    atime: Date;
    mtime: Date;
    ctime: Date;
    isDirectory: () => true;
  };
};
type FileSystemMock = FileMock | DirectoryMock;
const createFileMock = (
  name: string,
  parentDirectory?: DirectoryMock
): FileMock => {
  const file: FileMock = {
    name: name,
    stat: {
      size: 0,
      mode: 33188,
      birthtime: new Date(),
      atime: new Date(),
      mtime: new Date(),
      ctime: new Date(),
      isDirectory: () => false,
    },
  };

  if (parentDirectory) {
    parentDirectory.files[name] = file;
  }

  return file;
};
const createDirectoryMock = ({
  name,
  parentDirectory,
  childs = [],
}: {
  name: string;
  parentDirectory?: DirectoryMock;
  childs?: FileSystemMock[];
}): DirectoryMock => {
  const dir: DirectoryMock = {
    name: name,
    files: {},
    stat: {
      size: 0,
      mode: 33188,
      birthtime: new Date(),
      atime: new Date(),
      mtime: new Date(),
      ctime: new Date(),
      isDirectory: () => true,
    },
  };

  if (parentDirectory) {
    parentDirectory.files[name] = dir;
  }

  for (const aFile of childs) {
    dir.files[aFile.name] = aFile;
  }

  return dir;
};

function isDirectory(f: FileSystemMock): f is DirectoryMock {
  return f.stat.isDirectory();
}
