const fs = require('fs');
const path = require('path');

const ignores = [
	'/ignore/ign.jpg',
	'/ignore/ign.png',
	'/ignore/ign.txt',

	'/.thumb/thumb1.png',
	'/.thumb/thumb2.png',
	'/.thumb/thumb3.png',
	
	'/img.txt',
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

function createFile( root, fullpath ) {
	const info = path.parse( fullpath );
	fs.mkdirSync(
		path.join( root, info.dir ),
		{recursive: true},
	);
	fs.writeFileSync( path.join(root, fullpath), '' );
}

function isIgnoredFile( filename ) {
	return ignores.find( f => {
		const idx = f.indexOf( filename );
		return idx + filename.length === f.length-1;
	}) !== undefined;
}

module.exports = {
	files1,
	files2,
	ignores,
	isIgnoredFile,
	createFile,
}