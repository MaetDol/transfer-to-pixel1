export function isDirectory(path: string) {
  return path.slice(-1) === '/';
}

export function convertSeparator(path: string) {
  return path.replace(/\\/g, '/');
}

const escapeRegExp = (part: string) =>
  part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const singleAsterisk = (part: string) => part.replace(/^\*$/, '[^/]+');
const doubleAsterisk = (part: string) => part.replace(/^\*{2}$/, '([^/]+/?)+');
const asteriskInText = (part: string) =>
  part.replace(
    /([^*]*)\*([^*]+)|([^*]+)\*([^*]*)/,
    (_, group1, group2, group3, group4) =>
      escapeRegExp(group1 ?? group3) + '[^/]*' + escapeRegExp(group2 ?? group4)
  );

export function escape(part: string) {
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
