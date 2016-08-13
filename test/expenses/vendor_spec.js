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
    db.end().then(() => done()).catch(done);
  });

  it("fetches a vendor from the database", done => {
    Vendors.findById(2)
      .then(vendor => {
        expect(vendor).to.be.ok;
        done();
      })
      .catch(done);
  })
})
