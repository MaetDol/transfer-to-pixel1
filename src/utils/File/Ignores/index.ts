import { convertSeparator, escape, isDirectory } from './utils';

export class Ignores {
  ROOT: string;
  pathes: string[];
  dirPathes: RegExp[];
  filePathes: RegExp[];

  constructor(pathes: string[], ROOT = '') {
    ROOT = convertSeparator(ROOT);
    this.ROOT = isDirectory(ROOT) ? ROOT.slice(0, -1) : ROOT;
    this.pathes = pathes.map(convertSeparator);
    this.dirPathes = this.parse(pathes.filter(isDirectory));
    this.filePathes = this.parse(pathes.filter(p => !isDirectory(p)));
  }

  dir(path: string) {
    path = convertSeparator(path);
    if (!isDirectory(path)) {
      path += '/';
    }
    return this.dirPathes.some(ignore => ignore.test(path));
  }

  file(path: string) {
    path = convertSeparator(path);
    return this.filePathes.some(ignore => ignore.test(path));
  }

  parse(pathes: string[]) {
    const root = escape(this.ROOT);
    return pathes.map(path => {
      const parts = path.split('/');

      const isStartFromRoot = parts[0] === '';
      parts[0] = isStartFromRoot
        ? '^' + root
        : parts.length === 1
        ? parts[0]
        : escape(parts[0]);
      const lastPart = parts[parts.length - 1];
      const isFile = lastPart !== '';
      if (isFile) {
        parts[parts.length - 1] = escape(lastPart) + '$';
      }

      for (let i = 1; i < parts.length - 1; i++) {
        parts[i] = escape(parts[i]);
      }

      return new RegExp(parts.join('/'), 'i');
    });
  }
}
