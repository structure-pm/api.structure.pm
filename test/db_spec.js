import {expect} from 'chai';
import * as db from '../src/db';

describe("DB connection", () => {
  it("initializes a connection pool",done => {
    let pool = db.init({
      db: {
        connectionLimit: 100,
        host: '192.168.10.10',
        user: 'structulocal',
        password: '12345678',
        // database: undefined,
        debug: false,
      }
    });
    expect(pool).to.be.ok;
    done();
  })
});
