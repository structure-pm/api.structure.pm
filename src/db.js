import Promise from 'bluebird';
import mysql from 'mysql';

let initialized = false;
let pool = null;
let prefix = null;

export function init(config, options) {
  if (initialized && !options.force) return pool;

  prefix = config.dbPrefix;
  pool =    mysql.createPool(config.db);
  initialized = true;
  return pool;
}

export function end() {
  return new Promise((resolve, reject) => {
    if (!initialized) return resolve();
    pool.end(err => {
      if (err) return reject(err);
      return resolve();
    });
  });
}

export function getConnection(callback) {
  if (!initialized) throw new Error("DB Connection must be initialized before use.");

  return pool.getConnection(callback);
}

export function query(...args) {
  if (!initialized) throw new Error("DB Connection must be initialized before use.");

  return new Promise((resolve, reject) => {

    function callback(err, rows, fields) {
      if (err) return reject(err);
      return resolve([rows, fields]);
    }

    let queryArgs = args.concat(callback);
    pool.query.apply(pool, queryArgs);
  })
}

export function getPrefix() {
  if (!initialized) throw new Error("DB Connection must be initialized before use.");
  return prefix;
}
