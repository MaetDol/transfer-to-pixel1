const Ignores = require("../src/utils/File/Ignores");


describe('Ignore root directory test', () => {
	const ignoreMe = [
		'/a/z/',
		'/a/z/c/',

		'/a/b/c/',
		'/a/b/c/d/',

		'/a/bb/c/z/',

		'/a/bc/c/d/e/e/f/',
		'/a/bc/c/d/e/f/',
		'/a/bc/c/e/f/',
	];
	const doNotIgnoreMe = [
		'/b/',
		'/bc/',
		'/a/x/',
		'/a/bb/cd/',
		'/a/bc/c/x/e/',
		'/a/bc/c/x/e/e',
	];
	const ignoreDirs = [
		'/a/z/',
		'/a/b/*/',
		'/a/bb/*/z/',
		'/a/bc/c/**/e/f/'
	];
	const ignore = new Ignores( ignoreDirs );

	test('Director ignore test', () => {
		const rest = ignoreMe.filter( d => !ignore.dir(d) );
		expect( rest.length ).toEqual( 0 );
	});

	test('Do not ignore test', () => {
		const rest = doNotIgnoreMe.filter( d => !ignore.dir(d) );
		expect( rest ).toEqual(
			expect.arrayContaining( doNotIgnoreMe )
		);
	});
});
