import mysql from 'mysql';

export default (state) => ({
  prefix: state.dbPrefix || state.prefix,
  pool: mysql.createPool(state.db),

  /**
   * end
   *
   * Gracefully close all connections in the pool
   */
  end() {
    return new Promise((resolve, reject) => {
      if (!this.pool) return resolve();
      this.pool.end(err => {
        if (err) return reject(err);
        return resolve();
      });
    });
  },

  getConnection() {
    return new Promise((resolve, reject) => {
      if (!this.pool) throw new Error("DB Connection must be initialized before use.");

      return this.pool.getConnection((err, conn) => {
        if (err) return reject(err);
        return Promise.promisifyAll(conn);
      });
    });
  },

  // query(sql, options)
  // query(sql, values, options)
  query(sql, values, options) {

    if (values && !Array.isArray(values)) {
      options = values;
      values = undefined;
    }
    options = options || {};


    return new Promise((resolve, reject) => {
      if (!this.pool) throw new Error("DB Connection must be initialized before use.");

      function callback(err, rows, fields) {
        if (err) return reject(err);
        return resolve(rows);
      }

      if (options.transaction) {
        options.transaction.query({sql, values}, callback);
      } else {
        this.pool.query({sql, values}, callback);
      }
    })
  }


})
