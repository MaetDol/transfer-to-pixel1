const { Ignores } = require('./index');

describe('Ignore without asterisk', () => {
  test('directories', () => {
    const ignoreDirs = ['/a/b/c/', 'd/e/', '/f/'];
    const needIgnore = ['/a/b/c/', '/a/b/c/e/', '/a/d/e/e/', '/f/qw/'];
    const skipIgnore = ['/a/b/', '/b/c/', '/a/f/w/'];

    const ignore = new Ignores(ignoreDirs);
    const filtered = []
      .concat(needIgnore, skipIgnore)
      .filter(path => !ignore.dir(path));
    expect(filtered.sort()).toEqual(skipIgnore.sort());
  });

  test('files', () => {
    const ignoreFiles = ['/a/b/c/test.txt', 'ignoreme.js', 'abc/nah.png'];
    const needIgnore = [
      '/a/b/c/test.txt',
      '/a/w/c/ignoreme.js',
      '/a/b/abc/nah.png',
      '/abc/nah.png',
    ];
    const skipIgnore = [
      '/a/a/b/c/test.txt',
      '/a/b/c/test.txtt',
      '/abc/de/nah.png',
    ];

    const ignore = new Ignores(ignoreFiles);
    const filtered = []
      .concat(needIgnore, skipIgnore)
      .filter(path => !ignore.file(path));
    expect(filtered.sort()).toEqual(skipIgnore.sort());
  });
});

describe('Ignore with asterisk', () => {
  test('directories', () => {
    const ignoreDirs = ['/a/*/c/', '/a/**/e/', 'b/*/e/f/', 'c/**/f/'];
    const needIgnore = [
      '/a/b/c/',
      '/a/b/e/',
      '/a/b/c/e/',
      '/z/b/z/e/f/',
      '/z/c/d/e/f/',
    ];
    const skipIgnore = ['/a/c/', '/a/e/', '/z/c/f/', '/z/b/e/f/'];

    const ignore = new Ignores(ignoreDirs);
    const filtered = []
      .concat(needIgnore, skipIgnore)
      .filter(path => !ignore.dir(path));
    expect(filtered.sort()).toEqual(skipIgnore.sort());
  });

  test('files', () => {
    const ignoreFiles = [
      '/a/b/c/*.txt',
      'c/*/ignoreme.js',
      'd/**/yay.js',
      '/d/**/*.png',
    ];
    const needIgnore = [
      '/a/b/c/test.txt',
      '/a/b/c/abc.txt',
      '/z/c/c/ignoreme.js',
      '/a/d/c/c/c/yay.js',
      '/d/b/c/d/ignore.png',
    ];
    const skipIgnore = [
      '/a/a/b/c/test.txt',
      '/a/b/c/test.txtt',
      '/abc/de/nah.png',
      '/a/c/d/e/ignoreme.js',
      '/d/qw/e/yay.pn',
    ];

    const ignore = new Ignores(ignoreFiles);
    const filtered = []
      .concat(needIgnore, skipIgnore)
      .filter(path => !ignore.file(path));
    expect(filtered.sort()).toEqual(skipIgnore.sort());
  });
});
