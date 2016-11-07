import {expect} from 'chai';
import Promise from 'bluebird';
import * as db from '../../src/db';
import config from '../../src/config';
import Accounting from '../../src/domain/accounting';
import Income from '../../src/domain/accounting/income';

describe("Accounting | Income", () => {
  before(done => {
    db.init(config, {force: true});
    expect(db.getPrefix()).to.equal('structutest');
    return Promise.resolve()
      // .then(res => db.query(`INSERT INTO structutest_expenses.vendor (contactID, expenseID) VALUES (1, 123)`))
      // .tap(res => {billData.CreditorNumber = res.insertId + ''; billData2.CreditorNumber = res.insertId + '';} )
      // .then(()  => db.query(`INSERT INTO structutest_assets.location (locationID, ownerID) VALUES ('${locationID}', '${ownerID}')`) )
      // .then(res => db.query(`INSERT INTO structutest_assets.unit (locationID) VALUES ('${locationID}')`))
      // .then(res => unitID = res.insertId)
      .then(() => done())
      .catch(done);
  })

  after(done => {
    Promise.all([
      db.query(`TRUNCATE TABLE structutest_income.iLedger`),
      // db.query(`TRUNCATE TABLE structutest_assets.unit`),
      // db.query(`TRUNCATE TABLE structutest_assets.location`),
      // db.query(`TRUNCATE TABLE structutest_imports.imported_unknown_account`),
      // db.query(`TRUNCATE TABLE structutest_imports.imported_account_asset`),
      // db.query(`TRUNCATE TABLE structutest_log.google_cloud_objects`),
    ])
      .then(() => db.end() )
      .then(() => done())
      .catch(done);
  });

  describe("Income object", () => {
    it("Throws if missing a required field", () => {
      const dateStamp = '2016-01-01',
            amount = 100,
            incomeID = 1;
      const willThrow1 = () => new Income({dateStamp, amount});
      const willThrow2 = () => new Income({dateStamp, incomeID});
      const willThrow3 = () => new Income({incomeID, amount});
      const willNotThrow = () => new Income({dateStamp, amount, incomeID});

      expect(willThrow1).to.throw(Error);
      expect(willThrow2).to.throw(Error);
      expect(willThrow3).to.throw(Error);
      expect(willNotThrow).to.not.throw(Error);
    })

    it("makes an alias to entryID", () => {
      const dateStamp = '2016-01-01',
            amount = 100,
            incomeID = 1,
            entryID = 123;
      const income = new Income({dateStamp, amount, incomeID, entryID});
      expect(income.id).to.equal(entryID);
    })
  })

  describe("addIncome()", () => {
    it("adds an iLedger entry", done => {
      const dateStamp = '2016-01-01',
            amount = 100,
            incomeID = 1;
      Accounting.addIncome({dateStamp, amount, incomeID})
        .then(income => {
          expect(income).to.be.ok;
          expect(income.id).to.be.ok;
          done();
        })
        .catch(done);
    })
  })
})
