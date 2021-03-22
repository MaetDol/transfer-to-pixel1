const fs = require('fs');
const path = require('path');

const ignores = [
	'/ignore/ign.jpg',
	'/ignore/ign.png',
	'/ignore/ign.txt',

	'/.thumb/thumb1.png',
	'/.thumb/thumb2.png',
	'/.thumb/thumb3.png',
];
const invalid = [
	'/img.txt',
	'/inv/invalid',
	'/inv/invalidjpg',
];
const files1 = [
	'/img.png',
	'/img.jpg',
	'/img.jpeg',
	'/img.mp4',

	'/rec/rec2/rec3/rec4/deepDir/hey.jpeg',
];
const files2 = [
	'/newImage.png',
	'/newImage.jpg',
	'/newImage.jpeg',
	'/newImage.mp4',

	'/rec/rec2/rec3/rec4/deepDir/heyItsNew.jpeg',
];

function wholeFiles() {
	return [].concat( ignores, invalid, files1, files2 );
}

function createFile( root, fullpath ) {
	const info = path.parse( fullpath );
	fs.mkdirSync(
		path.join( root, info.dir ),
		{recursive: true},
	);
	fs.writeFileSync( path.join(root, fullpath), '' );
}

function isMatchedFile( name ) {
	return fullpath => {
		const idx = fullpath.indexOf( name );
		const expectIdx = fullpath.length - name.length;
		return idx === -1 ? false : idx === expectIdx;
	}
}

function isValid( filename ) {
	return !invalid.some( isMatchedFile(filename) );
}

function isIgnoredFile( filename ) {
	return ignores.find( isMatchedFile(filename) ) !== undefined;
}

module.exports = {
	files1,
	files2,
	ignores,
	invalid,
	isValid,
	isIgnoredFile,
	createFile,
	wholeFiles,
}