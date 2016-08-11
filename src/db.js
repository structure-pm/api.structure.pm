import mysql from 'mysql';

let initialized = false;
let pool = null;

export function init(config) {
  if (initialized) return pool;

  pool =    mysql.createPool(config.db);
  initialized = true;
  return pool;
}

export function getConnection(callback) {
  if (!initialized) throw new Error("DB Connection must be initialized before use.");

  return pool.getConnection(callback);
}
