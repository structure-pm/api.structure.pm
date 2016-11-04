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

  return new Promise((resolve, reject) => {
    return pool.getConnection((err, conn) => {
      if (err) return reject(err);
      return Promise.promisifyAll(conn);
    });
  });
}

// query(sql, options)
// query(sql, values, options)
export function query(sql, values, options) {
  if (!initialized) throw new Error("DB Connection must be initialized before use.");

  if (values && !Array.isArray(values)) {
    options = values;
    values = undefined;
  }
  options = options || {};


  return new Promise((resolve, reject) => {
    function callback(err, rows, fields) {
      if (err) {
        err.sql = mysql.format(sql, values);
        return reject(err);
      }
      
      return resolve(rows);
    }


    if (options.transaction) {
      options.transaction.query(sql, values, callback);
    } else {
      pool.query(sql, values, callback);
    }
  })
}

export function beginTransaction() {
  return new Promise((resolve, reject) => {
    if (!!this.activeTransaction) {
      return reject(new Error("There is already an active transaction on this connection.  Commit or rollback"))
    }

    pool.getConnection((err, conn) => {
      if (err) return reject(err);
      conn.beginTransaction(err => {
        if (err) return reject(err);
        return resolve(conn);
      });
    });
  });
}

export function commit(trans) {
  return new Promise((resolve, reject) => {
    trans.commit((err) => {
      if (err) return trans.rollback(rbErr => reject(err));
      return resolve();
    });
  });
}

export function rollback(trans) {
  return new Promise((resolve, reject) =>{
    trans.rollback(err => {
      if (err) return reject(err);
      return resolve();
    });
  });
}


export function getPrefix() {
  if (!initialized) throw new Error("DB Connection must be initialized before use.");
  return prefix;
}

export function escape(val) {
  return mysql.escape(val);
}
