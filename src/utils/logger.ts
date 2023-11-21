import fs from 'fs';
import path from 'path';
import { Properties } from './Properties';

const { LOG_DIR, LOGGING, ROOT } = new Properties().value;

const BASE = path.join(ROOT, LOG_DIR);

export const log = {
  info: (obj: unknown, isDisplayOnly?: boolean) => {
    write(`[INFO] ${stringify(obj)}`, isDisplayOnly);
  },
  err: (obj: unknown, isDisplayOnly?: boolean) => {
    write(`[ERROR] ${stringify(obj)}`, isDisplayOnly);
  },
};

function write(str: string, displayOnly?: boolean) {
  if (!LOGGING) return;

  if (displayOnly) {
    console.log(`${str}`);
    return;
  }

  const { year, month, date } = now();
  const dirPath = path.resolve(BASE, `./${year}`);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  fs.writeFileSync(
    path.resolve(
      dirPath,
      `./${pad(month.toString())}${pad(date.toString())}.log`
    ),
    str + '\n',
    { flag: 'a' }
  );
  console.log(str);
}

function pad(v: string) {
  return v.toString().padStart(2, '0');
}

function now() {
  const date = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    date: date.getUTCDate(),
  };
}

function stringify(input: unknown): string {
  if (typeof input === 'string') {
    return input;
  }
  if (typeof input === 'object') {
    return JSON.stringify(input, null, 2);
  }
  return String(input);
}
