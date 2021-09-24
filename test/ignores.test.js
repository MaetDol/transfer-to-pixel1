const Ignores = require("../src/utils/File/Ignores");


describe('Root dir test', () => {
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

	test('Directory ignore test', () => {
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

describe('Part of path ignore test', () => {
	const dirs = [
		'/a/',
		'/b/b/b/a/',
		'/b/b/c/',
		'/0/emulated/kakao/.thumbnail/',
		'/d/c/d/d/',
		'/e/q/d/d/d/e/f/g/',
	];
	const doNotIgnoreMe = [
		'/b/',
		'/b/b/d/',
		'/0/emulated/kakao/',
		'/d/c/d/',
		'/d/g/e/e/d/f/'
	];
	const ignoreDirs = [
		'a/',
		'b/c/',
		'kakao/.thumbnail/',
		'c/*/d/',
		'd/**/e/f/',
	]
	const ignore = new Ignores( ignoreDirs );

	test('Directory ignore test', () => {
		const rest = dirs.filter( d => !ignore.dir(d) );
		expect( rest.length ).toEqual( 0 );
	});

	test('Do not ignore test', () => {
		const rest = doNotIgnoreMe.filter( d => !ignore.dir(d) );
		expect( rest ).toEqual(
			expect.arrayContaining( doNotIgnoreMe )
		);
	});

	test('Empty test', () => {
		expect(0).toEqual(0);
	})
});