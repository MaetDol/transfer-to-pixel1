import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import fs from 'fs';
import { sep } from 'path';
import { runClient } from '../src/client';
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

beforeEach(() => console.log('.\n.\n.\n.\n.\n'));

describe('Upload', () => {
  afterEach(() => {
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
      const adjustTime = (ms: number) =>
        new Date(LAST_UPDATE.getTime() + ms).toISOString();
      const _5min_ago = adjustTime(-5 * 60 * 1000);
      const _1min_after = adjustTime(1 * 60 * 1000);

      // Given
      const files = parseFileSystemString(`
       ROOT/
        ├─ target
        │  ├─ old.jpg :: (ctime: ${_5min_ago})
        │  ├─ old.mp4 :: (ctime: ${_5min_ago})
        │  ├─ old.png :: (ctime: ${_5min_ago})
        │  │
        │  ├─ img.jpg   :: (ctime: ${_1min_after})
        │  ├─ img2.jpeg :: (ctime: ${_1min_after})
        │  ├─ vdo.mp4   :: (ctime: ${_1min_after})
      `);

      return files.files['ROOT'];
    }

    // When
    await runClient();

    // Then
    const uploadedFiles = send.mock.calls.map(
      ([file]: [File, boolean, unknown]) => file.name
    );
    const newFileNames = ['img.jpg', 'img2.jpeg', 'vdo.mp4'];
    expect(uploadedFiles.sort()).toEqual(newFileNames.sort());
  });
});

describe('Ignore', () => {
  beforeEach(() => {
    jest.mocked(send).mockImplementation(() => Promise.resolve(200));
    jest
      .spyOn(process, 'exit')
      .mockImplementation((() => {}) as typeof process.exit);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it.each([
    {
      label: 'specific directory',
      structure: `
        ROOT/
        ├─ target/
        │  ├─ img.jpg
        │  ├─ img2.jpeg
        │  ├─ vdo.mp4
        │  │
        │  ├─ ignore-me/
        │  │  ├─ not-me.jpg
        │  │  ├─ nah.mp4
        │  │  ├─ never.png
        `,
      targets: ['target'],
      ignore: ['ignore-me/'],
      expected: ['img.jpg', 'img2.jpeg', 'vdo.mp4'],
    },
    {
      label: 'file extension',
      structure: `
        ROOT/
        ├─ target/
        │  ├─ img.jpg
        │  ├─ img2.png
        │  ├─ img3.jpeg
        │  ├─ vdo.mp4
        `,
      targets: ['target'],
      ignore: ['.jpeg'],
      expected: ['img.jpg', 'img2.png', 'vdo.mp4'],
    },
    {
      label: 'specific file name',
      structure: `
        ROOT/
        ├─ target/
        │  ├─ img.jpg
        │  ├─ not-me.jpg
        │  ├─ vdo.mp4
        │  │
        │  ├─ sub_dir/
        │  │  ├─ not-me.jpg
        │  │  ├─ nah.mp4
        │  │  ├─ yay.png
        `,
      ignore: ['not-me.jpg'],
      targets: ['target'],
      expected: ['img.jpg', 'vdo.mp4', 'nah.mp4', 'yay.png'],
    },
    {
      label: 'asterisk',
      structure: `
        ROOT/
        ├─ target/
        │  ├─ img.jpg
        │  ├─ vdo.mp4
        │  │
        │  ├─ sub/
        │  │  ├─ not-me.jpg
        │  │  ├─ nah.mp4
        `,
      ignore: ['vdo.*', 'target/**/not-me.jpg'],
      targets: ['target'],
      expected: ['img.jpg', 'nah.mp4'],
    },
  ])('Ignore $label', async ({ expected, ignore, structure, targets }) => {
    // Mocking
    const mockedFs = jest.mocked(fs);

    mockedFs.statSync.mockImplementation(mockStatSync(getFileTree));
    mockedFs.readdirSync.mockImplementation(mockReaddirSync(getFileTree));
    mockedFs.readFileSync.mockImplementation(
      mockReadFileSyncForPropsJson({
        ROOT: 'ROOT',
        targets: targets,
        ignores: ignore,
        LAST_UPDATE: new Date(0).toISOString(),
      })
    );

    function getFileTree(): FileSystemMock {
      // Given
      const files = parseFileSystemString(structure);
      return files.files['ROOT'];
    }

    // When
    await runClient();

    // Then
    const uploadedFiles = send.mock.calls.map(
      ([file]: [File, boolean, unknown]) => file.name
    );
    expect(uploadedFiles.sort()).toEqual(expected.sort());
  });
});

function parseFileSystemString(structure: string) {
  /**
 *  사용 예:
 *   ROOT/
      ├─ img.jpg
      ├─ img1.jpg
      ├─ vdo.mp3 :: (ctime: ${new Date().toISOString()})
      │
      ├─ subdir/
      │  ├─ also.jpg
      │  ├─ skip.mp3
      │  │
      │  ├─ ignoreMe/
      │  │  ├─ ignore.jpg
      │  │  ├─ skip.mp3
      │  │  ├─ not-me.raw
      │
      ├─ empty/
      │
      Others/
 */
  const OBJECT_INDICATOR = '├─';
  const DEPTH_INDICATOR = '│  ';
  const ATTRIBUTE_INDICATOR = '::';

  const lines = structure
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length)
    .filter(line => !line.endsWith(DEPTH_INDICATOR.trim()))
    .filter(line => !line.endsWith(OBJECT_INDICATOR));

  const root = createDirectoryMock({
    name: '',
  });

  let directories: DirectoryMock[] = [root];
  let prevInfo: {
    filename: string;
    attributes: { [name: string]: unknown };
    isAbsolutlyDirectory: true | null;
  } | null = null;

  for (const line of lines) {
    const [filename, attributesRaw, isAbsolutlyDirectory] =
      getNameAndAttributesFrom(line);
    const attributes = parseAttributes(attributesRaw);
    const fileInfo = {
      filename,
      attributes,
      isAbsolutlyDirectory,
    };

    if (!prevInfo) {
      prevInfo = fileInfo;
      continue;
    }

    const previousDepth = directories.length - 1;
    // 폴더 뎁스가 늘어났을때
    if (previousDepth < calculateDepthOf(line)) {
      const dir = createDirectoryMock({
        name: prevInfo.filename,
        childs: [],
        parentDirectory: directories.at(-1),
        stat: prevInfo.attributes,
      });
      directories.push(dir);
      prevInfo = fileInfo;
      continue;
    }

    // 폴더 뎁스가 줄어들었을때 or 유지되었을때
    if (prevInfo.isAbsolutlyDirectory) {
      createDirectoryMock({
        name: prevInfo.filename,
        parentDirectory: directories.at(-1),
        stat: prevInfo.attributes,
      });
    } else {
      createFileMock({
        name: prevInfo.filename,
        parentDirectory: directories.at(-1),
        stat: prevInfo.attributes,
      });
    }

    const targetDepth = previousDepth - calculateDepthOf(line);
    for (let i = 0; i < targetDepth; i++) {
      directories.pop();
    }
    prevInfo = fileInfo;
  }

  if (!prevInfo) throw 'There is nothing to create file-system';
  createFileMock({
    name: prevInfo.filename,
    parentDirectory: directories.at(-1),
    stat: prevInfo.attributes,
  });

  return directories[0];

  function getNameAndAttributesFrom(
    line: string
  ): [string, string, true | null] {
    const [fileName, attrRaw = ''] = line
      .replace(new RegExp(OBJECT_INDICATOR, 'g'), '')
      .replace(new RegExp(DEPTH_INDICATOR, 'g'), '')
      .trim()
      .split(new RegExp(`\\s*${ATTRIBUTE_INDICATOR}\\s*`));

    // true 라면 폴더가 확실하나, 아닐경우 파일 또는 폴더가 될 수 있음
    const isAbsolutlyDirectory = fileName.endsWith('/') || null;
    return [fileName.replace(/\/$/, ''), attrRaw, isAbsolutlyDirectory];
  }

  function parseAttributes(attributesRaw: string) {
    return attributesRaw
      .split(/\)\s*\(/)
      .map(attrRaw => attrRaw.trim())
      .map(attrRaw => attrRaw.replace(/^\(\s*|\s*\)$/g, ''))
      .reduce((attrs: { [name: string]: unknown }, attrRaw) => {
        if (!attrRaw.length) return attrs;

        const separatorIdx = attrRaw.indexOf(':');
        const attrName = attrRaw.slice(0, separatorIdx).trim();
        const value = attrRaw.slice(separatorIdx + 1).trim();

        if (/^\d+$/.test(value)) {
          attrs[attrName] = Number(value);
        } else if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
          attrs[attrName] = new Date(value);
        } else {
          attrs[attrName] = value;
        }

        return attrs;
      }, {});
  }

  function calculateDepthOf(line: string) {
    const depthIndicatorNumber =
      line.match(new RegExp(DEPTH_INDICATOR, 'g'))?.length ?? 0;
    const objectIndicatorNumber =
      line.match(new RegExp(OBJECT_INDICATOR, 'g'))?.length ?? 0;
    return depthIndicatorNumber + objectIndicatorNumber;
  }
}

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
const createFileMock = ({
  name,
  parentDirectory,
  stat = {},
}: {
  name: string;
  parentDirectory?: DirectoryMock;
  stat?: Partial<FileMock['stat']>;
}): FileMock => {
  const file: FileMock = {
    name: name,
    stat: {
      size: 0,
      mode: 33188,
      birthtime: new Date(),
      atime: new Date(),
      mtime: new Date(),
      ctime: new Date(),
      ...stat,

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
  stat = {},
}: {
  name: string;
  parentDirectory?: DirectoryMock;
  childs?: FileSystemMock[];
  stat?: Partial<DirectoryMock['stat']>;
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
      ...stat,

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

function printFileStructure(file: FileSystemMock, depth = 0) {
  let result =
    (depth === 0
      ? file.name
      : depth === 1
      ? '├─' + file.name
      : '│  '.repeat(depth - 1) + '├─' + file.name) + '\n';

  if (isDirectory(file)) {
    Object.values(file.files).forEach(
      f => (result += printFileStructure(f, depth + 1))
    );
  }

  return result;
}
