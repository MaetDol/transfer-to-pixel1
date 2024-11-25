var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/server.ts
var import_fs3 = __toESM(require("fs"));
var import_http = __toESM(require("http"));
var import_path3 = __toESM(require("path"));

// src/utils/Properties.ts
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var Properties = class {
  path = "";
  _prop;
  constructor(pathToJson) {
    if (pathToJson === void 0 || pathToJson === null) {
      if (false) {
        throw new Error(`TTP_APP_PROPERTIES_FILE_PATH env value is undefined`);
      }
      this.path = import_path.default.resolve(
        __dirname,
        "./properties.json"
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
    const propFile = import_fs.default.readFileSync(this.path, { encoding: "utf-8" });
    if (!propFile)
      throw "properties.json is empty!";
    const prop2 = JSON.parse(propFile);
    if (!prop2.targets.length)
      throw "There is no target directories for watching";
    prop2.LAST_UPDATE = new Date(prop2.LAST_UPDATE);
    this._prop = prop2;
  }
  write(prop2) {
    this._prop = prop2;
    import_fs.default.writeFileSync(this.path, JSON.stringify(prop2, null, 4));
  }
};

// src/utils/logger.ts
var import_fs2 = __toESM(require("fs"));
var import_path2 = __toESM(require("path"));
var { LOG_DIR, LOGGING, ROOT } = new Properties().value;
var BASE = import_path2.default.join(ROOT, LOG_DIR);
var log = {
  info: (obj, isDisplayOnly) => {
    write(`[INFO] ${stringify(obj)}`, isDisplayOnly);
  },
  err: (obj, isDisplayOnly) => {
    write(`[ERROR] ${stringify(obj)}`, isDisplayOnly);
  }
};
function write(str, displayOnly) {
  if (!LOGGING)
    return;
  if (displayOnly) {
    console.log(`${str}`);
    return;
  }
  const { year, month, date } = now();
  const dirPath = import_path2.default.resolve(BASE, `./${year}`);
  if (!import_fs2.default.existsSync(dirPath)) {
    import_fs2.default.mkdirSync(dirPath, { recursive: true });
  }
  import_fs2.default.writeFileSync(
    import_path2.default.resolve(
      dirPath,
      `./${pad(month.toString())}${pad(date.toString())}.log`
    ),
    str + "\n",
    { flag: "a" }
  );
  console.log(str);
}
function pad(v) {
  return v.toString().padStart(2, "0");
}
function now() {
  const date = new Date((/* @__PURE__ */ new Date()).getTime() + 9 * 60 * 60 * 1e3);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    date: date.getUTCDate()
  };
}
function stringify(input) {
  if (typeof input === "string") {
    return input;
  }
  if (typeof input === "object") {
    return JSON.stringify(input, null, 2);
  }
  return String(input);
}

// src/server.ts
var prop = new Properties();
var { ROOT: ROOT2, PORT, UPLOAD_DIR } = prop.value;
var UPLOAD = import_path3.default.join(ROOT2, UPLOAD_DIR);
if (!import_fs3.default.existsSync(UPLOAD)) {
  log.info(`Directory ${UPLOAD} is not exists. creating..`);
  import_fs3.default.mkdirSync(UPLOAD, { recursive: true });
}
import_http.default.createServer((req, res) => {
  try {
    log.info("\n");
    log.info(/* @__PURE__ */ new Date());
    log.info(req.headers);
    log.info(req.method);
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (req.method === void 0) {
      res.writeHead(400).end();
      return;
    }
    if (req.headers["content-type"] === void 0) {
      res.writeHead(400).end();
      return;
    }
    if (req.method.toUpperCase() === "OPTIONS") {
      res.writeHead(400).end();
      return;
    }
    if (!/image|video|audio/.test(req.headers["content-type"])) {
      log.err("invalid content-type");
      res.writeHead(400).end();
      return;
    }
    if (req.method.toUpperCase() !== "POST") {
      log.err("invalid method");
      res.writeHead(405).end();
      return;
    }
    const [, encodedName] = (req.headers["content-disposition"] ?? "").match(/filename="(.+)"/) ?? [];
    if (!encodedName) {
      log.err("filename not provided");
      res.writeHead(415).end();
      return;
    }
    const filename = decodeURI(encodedName);
    const uploadPath = import_path3.default.resolve(UPLOAD, filename);
    req.on("error", (e) => {
      log.err(`Got an error on Request: ${e}`);
      import_fs3.promises.rm(uploadPath).catch(() => {
      });
      res.writeHead(400).end();
    });
    req.pipe(import_fs3.default.createWriteStream(uploadPath));
    req.on("end", () => {
      res.writeHead(200).end();
      log.info(`${filename} - Done! 200`);
    });
  } catch (e) {
    log.err("Internal server error " + e);
    res.writeHead(500).end();
  }
}).listen(PORT, () => {
  log.info("Server is Running");
  log.info(/* @__PURE__ */ new Date());
});
