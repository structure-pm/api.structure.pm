import {expect} from 'chai';
import * as db from '../../src/db';
import config from '../../src/config';
import ImportScanService from '../../src/domain/scan/importScan.service';

describe("ImportScan service", () => {
  const ownerID = 'testOwn';
  const locationID = 'testLoc';
  let unitID;

  before(done => {
    db.init(config, {force: true});
    return db.query(`INSERT INTO structutest_assets.location (locationID, ownerID) VALUES ('${locationID}', '${ownerID}')`)
      .then(res => db.query(`INSERT INTO structutest_assets.unit (locationID) VALUES ('${locationID}')`))
      .then(res => unitID = res.insertId)
      .then(() => done())
      .catch(done);
  });
  after(done => {
    Promise.all([
      db.query(`TRUNCATE TABLE structutest_assets.unit`),
      db.query(`TRUNCATE TABLE structutest_assets.location`),
      db.query(`TRUNCATE TABLE structutest_imports.imported_unknown_account`),
      db.query(`TRUNCATE TABLE structutest_imports.imported_account_asset`),
    ])
      .then(() => db.end() )
      .then(() => done())
      .catch(done);
  });


  describe("importScan", () => {
    it("creates an unknownAccount object when an account's asset is not found", done => {
      let fired = false;
      // Mocked Repos
      const AccountAssetRepo = {
        findByAccountNumber(an,vid) { fired = true; return Promise.resolve(null); }
      };
      const UnknownAccountsRepo = {
        create(data) { return Promise.resolve({id: 123})},
      };

      let ImportScan = ImportScanService();

      ImportScan.repositories.AccountAssets = AccountAssetRepo;
      ImportScan.repositories.UnknownAccounts = UnknownAccountsRepo;
      ImportScan.importScan({
        AccountNumber: "abc",
        CreditorNumber: 1,
        CurrentAmount: 123,
        TotalAmount: 123,
        DueDate: '2016-12-14'
      })
      .then(results => {
        expect(fired).to.be.ok;
        expect(results.result).to.equal(ImportScan.RESULT_UNKNOWN_ACCOUNT);
        expect(results.data.unknownAccountId).to.equal(123);
        done();
      }).catch(done);
    });

    it("Creates a bill from a scan", done=> {
      let fired = false;
      let billID = 3;
      const AccountAssetRepo = {
        findByAccountNumber(an, vid) {return Promise.resolve({
          accountNumber: 'abc',
          vendorID: 1,
          expenseID: 1,
          assetType: 'location',
          assetID: locationID,
        })}
      };
      let ImportScan = ImportScanService();
      ImportScan.importScan({
        AccountNumber: "abc",
        CreditorNumber: 1,
        CurrentAmount: 123,
        TotalAmount: 123,
        DueDate: '2016-12-14'
      })
        .then(results => {
          expect(fired).to.be.ok;
          expect(results.result).to.equal(ImportScan.RESULT_BILL_CREATED);
          expect(results.data.id).to.equal(billID);
          done();
        }).catch(done);
    });

  });
});
