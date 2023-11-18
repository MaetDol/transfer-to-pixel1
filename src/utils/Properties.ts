export type PropertiesJson = {
  ROOT: string;
  LOGGING: boolean;
  LOG_DIR: string;

  // Client
  SERVER: string;
  PORT: `${number}`;
  LAST_UPDATE: string;
  targets: string[];
  ignores: string[];
  DELETE_AFTER_UPLOAD: boolean;

  // Server
  UPLOAD_DIR: string;
};
