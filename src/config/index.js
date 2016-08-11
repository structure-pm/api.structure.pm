import path from 'path';
import fs from 'fs';

const ENV = process.env.NODE_ENV || "development";
const defaultConfigFile = path.join(__dirname, "default.js");
const envConfigFile = path.join(__dirname, `${ENV}.js`);
let config = undefined;


function fileExistsSync(path) {
  try {
    fs.accessSync(path, fs.F_OK);
    return true;
  } catch (e) {
    return false
  }
}

if (!fileExistsSync(defaultConfigFile)) {
  throw new Error("Missing default config file");
}


const defaultConfig = require(defaultConfigFile);
config = Object.assign({}, defaultConfig);

if (fileExistsSync(envConfigFile)) {
  let envConfig = require(envConfigFile);
  config = Object.assign(config, envConfig);
}

export default config;
