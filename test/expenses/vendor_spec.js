import {expect} from 'chai';
import config from '../../src/config';
import * as db from '../../src/db';
import createVendors from '../../src/domain/expenses/vendor.repository';

describe('Vendor Repository', () => {
  let Vendors = createVendors();

  before(() => {
    db.init(config, {force: true});
  });
  after(done => {
    const vendorTable = db.getPrefix() + "_expenses.vendor";
    db.query(`TRUNCATE TABLE ${vendorTable}`)
      .then(() => db.end() )
      .then(() => done())
      .catch(done);
  });


  it("creates a vendor", done => {
    const vendorTable = db.getPrefix() + "_expenses.vendor";
    db.query(`INSERT INTO ${vendorTable} (expenseID) values (1)`)
      .then(res =>Vendors.findById(res.insertId) )
      .then(vendor => {
        expect(vendor).to.be.ok;
        done();
      })
      .catch(done);
  })
})
