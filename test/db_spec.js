import {expect} from 'chai';
import * as db from '../src/db';

describe("DB connection", () => {
  it("initializes a connection pool",done => {
    let pool = db.init({
      db: {
        connectionLimit: 100,
        host: 'localhost',
        port: 33066,
        user: 'root',
        password: '12345678',
        // database: undefined,
        debug: false,
      }
    });
    expect(pool).to.be.ok;
    done();
  });

  it("performs a simple query", done => {
    db.query("SELECT 1 as first, 'abc' as second")
      .spread((rows, fields) => {
        expect(rows.length).to.equal(1);
        expect(rows[0].first).to.equal(1);
        expect(rows[0].second).to.equal('abc');
        done();
      })
      .catch(err => {
        console.log(err);
        done(err);
      });
  })
});
