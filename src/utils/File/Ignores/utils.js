function isDirectory(path) {
  return path.slice(-1) === '/';
}

function convertSeparator(path) {
  return path.replace(/\\/g, '/');
}

const escapeRegExp = part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const singleAsterisk = part => part.replace(/^\*$/, '[^/]+');
const doubleAsterisk = part => part.replace(/^\*{2}$/, '([^/]+/?)+');
const asteriskInText = part =>
  part.replace(
    /([^*]*)\*([^*]+)|([^*]+)\*([^*]*)/,
    (_, group1, group2, group3, group4) =>
      escapeRegExp(group1 ?? group3) + '[^/]*' + escapeRegExp(group2 ?? group4)
  );

function escape(part) {
  const escapeSingleAsterisk = singleAsterisk(part);
  if (escapeSingleAsterisk !== part) {
    return escapeSingleAsterisk;
  }
  const escapeDoubleAsterisk = doubleAsterisk(part);
  if (escapeDoubleAsterisk !== part) {
    return escapeDoubleAsterisk;
  }
  const escapeAsteriskInText = asteriskInText(part);
  if (escapeAsteriskInText !== part) {
    return escapeAsteriskInText;
  }
  return escapeRegExp(part);
}

module.exports = {
  isDirectory,
  convertSeparator,
  escape,
};
