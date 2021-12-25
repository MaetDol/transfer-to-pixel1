const Ignores = require('./index.js');

describe('Ignore without asterisk', () => {

	test('directories', () => {
		const ignoreDirs = [
			'/a/b/c/',
			'd/e/',
			'/f/',
		];
		const needIgnore = [
			'/a/b/c/',
			'/a/b/c/e/',
			'/a/d/e/e/',
			'/f/qw/',
		];
		const skipIgnore = [
			'/a/b/',
			'/b/c/',
			'/a/f/w/',
		];

		const ignore = new Ignores( ignoreDirs );
		const filtered = 
			[].concat( needIgnore, skipIgnore ) 
			.filter( path => !ignore.dir(path) );
		expect( filtered.sort() ).toEqual( skipIgnore.sort() );
	});

	test('files', () => {
		const ignoreFiles = [
			'/a/b/c/test.txt',
			'ignoreme.js',
			'abc/nah.png',
		];
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

		const ignore = new Ignores( ignoreFiles );
		const filtered = 
			[].concat( needIgnore, skipIgnore ) 
			.filter( path => !ignore.file(path) );
		expect( filtered.sort() ).toEqual( skipIgnore.sort() );
	});
}); 

