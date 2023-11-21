import fs from 'fs';
import path from 'path';

export type PropertiesJson = {
  ROOT: string;
  LOGGING: boolean;
  LOG_DIR: string;

  // Client
  SERVER: string;
  PORT: `${number}` | number;
  LAST_UPDATE: string;
  targets: string[];
  ignores: string[];
  DELETE_AFTER_UPLOAD: boolean;

  // Server
  UPLOAD_DIR: string;
};

export type PropertiesSet = Omit<PropertiesJson, 'LAST_UPDATE'> & {
  LAST_UPDATE: Date;
};

export class Properties {
  public path: string = '';
  private _prop: PropertiesSet;

  constructor(pathToJson?: string) {
    if (pathToJson === undefined || pathToJson === null) {
      if (process.env.TTP_APP_PROPERTIES_FILE_PATH === undefined) {
        throw new Error(`TTP_APP_PROPERTIES_FILE_PATH env value is undefined`);
      }

      this.path = path.resolve(
        __dirname,
        process.env.TTP_APP_PROPERTIES_FILE_PATH
      );
    } else {
      this.path = pathToJson;
    }

    this.read();
  }

  get value() {
    return this._prop;
  }

  read() {
    const propFile = fs.readFileSync(this.path, { encoding: 'utf-8' });
    if (!propFile) throw 'properties.json is empty!';

    const prop = JSON.parse(propFile);
    if (!prop.targets.length)
      throw 'There is no target directories for watching';

    prop.LAST_UPDATE = new Date(prop.LAST_UPDATE);
    this._prop = prop;
  }

  write(prop: PropertiesSet) {
    this._prop = prop;
    fs.writeFileSync(this.path, JSON.stringify(prop, null, 4));
  }
}
