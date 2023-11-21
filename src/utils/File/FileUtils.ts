import fs from 'fs';
import path from 'path';
import { log } from '../logger';
import type { Ignores } from './Ignores';

export function lookupNewFile(dir: string, ignore: Ignores, LAST_UPDATE: Date) {
  const result: string[] = [];
  const dirs: string[] = [dir];
  while (dirs.length) {
    const currentDir = dirs.pop();
    if (currentDir === undefined) {
      throw new Error(`Failed lookup directory: target is undefined`);
    }

    if (ignore.dir(currentDir)) continue;

    fs.readdirSync(currentDir).forEach(name => {
      const fullPath = path.join(currentDir, name);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        dirs.push(fullPath);
        return;
      }
      if (LAST_UPDATE > stat.ctime) return;
      if (ignore.file(fullPath)) return;

      result.push(fullPath);
    });
  }

  return result;
}

export function contentTypeOf(ext: string) {
  if (ext.match(/jpe?g|gif|png|bmp|tiff/i)) {
    return 'image';
  }
  if (ext.match(/mp4[pv]?|mp3|webm|avi|wmv/i)) {
    return 'video';
  }
}

export function getNewFiles(
  ROOT: string,
  dirs: string[],
  ignores: Ignores,
  LAST_UPDATE: Date
) {
  return dirs
    .map(d => {
      let newFiles: string[] = [];
      try {
        newFiles = lookupNewFile(path.join(ROOT, d), ignores, LAST_UPDATE);
      } catch (e) {
        log.err('Failed while lookup new file ' + e);
      }
      return newFiles;
    })
    .flat();
}
