import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  jest,
  xdescribe,
} from '@jest/globals';
import fs from 'fs';
import { sep } from 'path';
import { PropertiesJson } from '../src/utils/Properties';
// @ts-ignore
import { send } from '../src/utils/request';
// @ts-ignore
import { File } from '../src/utils/File';

jest.mock('fs');
jest.mock('http');

jest.mock('../src/utils/logger', () => ({
  info: console.log,
  err: console.warn,
}));
jest.mock('../src/utils/request');
jest.mock('../src/utils/File/Exif');

describe('Upload', () => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  it('Upload media files that were updated after LAST_UPDATE', async () => {
    // Mocking
    const mockedFs = jest.mocked(fs);
    const LAST_UPDATE = new Date();

    mockedFs.statSync.mockImplementation(mockStatSync(getFileTree));
    mockedFs.readdirSync.mockImplementation(mockReaddirSync(getFileTree));
    mockedFs.readFileSync.mockImplementation(
      mockReadFileSyncForPropsJson({
        ROOT: 'ROOT',
        targets: ['/target'],
        LAST_UPDATE: LAST_UPDATE.toISOString(),
      })
    );

    jest.mocked(send).mockImplementation(() => Promise.resolve(200));

    jest
      .spyOn(process, 'exit')
      .mockImplementation((() => {}) as typeof process.exit);

    function getFileTree(): FileSystemMock {
      return createDirectoryMock({
        name: 'ROOT',
        childs: [
          createDirectoryMock({
            name: 'target',
            childs: [...oldFiles, ...newFiles],
          }),
        ],
      });
    }

    // Given
    const oldFiles: FileSystemMock[] = ['old.jpg', 'old.mp4', 'old.png']
      .map(name => createFileMock(name))
      .map(file => {
        // 파일 생성 시점을 5분 전으로 설정
        file.stat.ctime = new Date(LAST_UPDATE.getTime() - 5 * 60 * 1000);
        return file;
      });

    const newFiles: FileSystemMock[] = ['img.jpg', 'img2.jpeg', 'vdo.jpg']
      .map(name => createFileMock(name))
      .map(file => {
        // 파일 생성 시점을 검사 기준 1분 후로 설정
        file.stat.ctime = new Date(LAST_UPDATE.getTime() + 1 * 60 * 1000);
        return file;
      });

    // When
    await import('../src/client');

    // Then
    const uploadedFiles = send.mock.calls.map(
      ([file]: [File, boolean, unknown]) => file.name
    );
    const newFileNames = newFiles.map(({ name }) => name);
    expect(uploadedFiles.sort()).toEqual(newFileNames.sort());
  });
});

function mockStatSync(getFileTree: () => FileSystemMock) {
  return ((path: string): fs.Stats => {
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

      ...getFileSystemByPath(path, getFileTree()).stat,
    };
  }) as typeof fs.statSync;
}

function mockReaddirSync(getFileTree: () => FileSystemMock) {
  return ((path: string): string[] => {
    const targetDirectory = getFileSystemByPath(path, getFileTree());

    if (isDirectory(targetDirectory)) {
      return Object.keys(targetDirectory.files);
    }

    throw `${targetDirectory.name} is not a directory`;
  }) as typeof fs.readdirSync;
}

function mockReadFileSyncForPropsJson(customProps: Partial<PropertiesJson>) {
  return ((path: string): string | Buffer => {
    const PROPS_JSON_PATH = process.env.TTP_APP_PROPERTIES_FILE_PATH;
    if (!PROPS_JSON_PATH) {
      throw 'TTP_APP_PROPERTIES_FILE_PATH env not found';
    }

    const PROPS_JSON_FILENAME = PROPS_JSON_PATH.slice(
      PROPS_JSON_PATH.lastIndexOf('/') + 1
    );

    if (path.endsWith(PROPS_JSON_FILENAME)) {
      return createClientPropertiesJson(customProps);
    }

    return Buffer.from(path);
  }) as typeof fs.readFileSync;
}

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
