import {expect} from 'chai';
import proxyquire from 'proxyquire';
import * as db from '../../src/db';
import config from '../../src/config';
import BillScan from '../../src/domain/scan/billScan';
import Scan from '../../src/domain/scan';

describe('Scan | Service', () => {
  before(() => {
    db.init(config, {force: true});
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


  describe("createBillFromScan()", () => {
    const ownerID = 'testOwn';
    const locationID = 'testLoc';
    let unitID;

    before(done => {
      return db.query(`INSERT INTO structutest_assets.location (locationID, ownerID) VALUES ('${locationID}', '${ownerID}')`)
        .then(res => db.query(`INSERT INTO structutest_assets.unit (locationID) VALUES ('${locationID}')`))
        .then(res => unitID = res.insertId)
        .then(() => done())
        .catch(done);
    })

    it('creates a bill for a unit', done => {
      const billScan = new BillScan({
        CreditorNumber: '1',
        AccountNumber: '1234',
        CurrentAmount: 12,
        TotalAmount: 12,
        DueDate: '2025-12-31',
      });
      const asset = {
        assetType: 'unit',
        assetID: unitID,
        vendorID: 1,
        expenseID: 1
      }
      Scan.createBillFromScan(billScan, asset)
        .then(bill => {
          expect(bill).to.be.ok;
          expect(parseInt(bill.unitID, 10)).to.equal(unitID);
          expect(bill.amount).to.equal(billScan.TotalAmount);
          done();
        })
        .catch(done);
    })

    it('creates a bill for a location', done => {
      const billScan = new BillScan({
        CreditorNumber: '1',
        AccountNumber: '1234',
        CurrentAmount: 12,
        TotalAmount: 12,
        DueDate: '2025-12-31',
      });
      const asset = {
        assetType: 'location',
        assetID: locationID,
        vendorID: 1,
        expenseID: 1
      }
      Scan.createBillFromScan(billScan, asset)
        .then(bill => {
          expect(bill).to.be.ok;
          expect(bill.locationID).to.equal(locationID);
          expect(bill.amount).to.equal(billScan.TotalAmount);
          done();
        })
        .catch(done);
    })
  });

  describe("importScannedBill()", () => {
    const accountNumber = 'abcsdklja',
          locationID = 'importScannedBillTestLoc',
          ownerID = 'importScannedBillTestOwn';
    let unitID;

    before(done => {
      const assetTable = 'structutest_imports.imported_account_asset';
      const assetFields = 'accountNumber, vendorID, expenseID, assetType, assetID';
      const insertAccountAsset = `INSERT INTO ${assetTable} (${assetFields}) VALUES ('${accountNumber}', 1, 1, 'unit', ${unitID})`;

      return db.query(`INSERT INTO structutest_assets.location (locationID, ownerID) VALUES ('${locationID}', '${ownerID}')`)
        .then(res => db.query(`INSERT INTO structutest_assets.unit (locationID) VALUES ('${locationID}')`))
        .then(res => db.query(`INSERT INTO ${assetTable} (${assetFields}) VALUES ('${accountNumber}', 1, 1, 'unit', ${res.insertId})`))
        .then(() => done())
        .catch(done)
    });


    it("creates an unknown account for new scans", done => {
      const scanData = {
        CreditorNumber: 1,
        AccountNumber: '1234',
        CurrentAmount: 12,
        TotalAmount: 12,
        DueDate: '2025-12-31'
      }
      Scan.importScannedBill(scanData)
        .then(resp => {
          expect(resp.result).to.equal('RESULT_UNKNOWN_ACCOUNT');
          expect(resp.message).to.be.ok;
          expect(resp.data).to.have.property('unknownAccountId');
          expect(resp.data.unknownAccountId).to.be.ok;
          expect(resp.scanUploadURL).to.contain('https://');
          expect(resp.scanUploadURL).to.contain('assetType=unknownAccount');
          expect(resp.scanUploadURL).to.not.contain('undefined');

          const q = `SELECT * FROM structutest_imports.imported_unknown_account where id = ${resp.data.unknownAccountId}`;
          return db.query(q);
        })
        .then(uas => {
          expect(uas.length).to.equal(1);
          done();
        })
        .catch(done);
    });

    it("creates bill for a scan of a known account", done => {
      const scanData = {
        CreditorNumber: 1,
        AccountNumber: accountNumber,
        CurrentAmount: 12,
        TotalAmount: 12,
        DueDate: '2025-12-31'
      }
      Scan.importScannedBill(scanData)
        .then(resp => {
          expect(resp.result).to.equal('RESULT_BILL_CREATED');
          expect(resp.message).to.be.ok;
          expect(resp.data).to.have.property('entryID');
          expect(resp.data.entryID).to.be.ok;
          expect(resp.scanUploadURL).to.contain('https://');
          expect(resp.scanUploadURL).to.contain('assetType=eLedger');
          expect(resp.scanUploadURL).to.not.contain('undefined');

          const q = `SELECT * FROM structutest_expenses.eLedger where entryID = ${resp.data.entryID}`;
          return db.query(q);
        })
        .then(uas => {
          expect(uas.length).to.equal(1);
          done();
        })
        .catch(done);
    });
  });

  describe("clearUnknownAccount()", () => {
    const ownerID = 'clearUnknownAccountOwn';
    const locationID = 'clearUnknownAccountLoc';
    let unitID;
    let movedFiles = [];

    const scanStubs = {
      "../assets": {
        getGFilesForAsset: function(assetType, assetID, options) {
          const gFiles = [
            {id: 1, title: 'test1.txt', filename: 'test1.txt', assetType, assetID, },
            {id: 1, title: 'test2.txt', filename: 'test2.txt', assetType, assetID, },
          ]
          return Promise.resolve(gFiles);
        },
        moveGFile: function(fileObjectId, gfileData) {
          movedFiles.push([fileObjectId, gfileData]);
          return Promise.resolve("blarg");
        },
        '@noCallThru': true
      }
    }
    const Scan = proxyquire('../../src/domain/scan', scanStubs);

    before(done => {
      return db.query(`INSERT INTO structutest_assets.location (locationID, ownerID) VALUES ('${locationID}', '${ownerID}')`)
        .then(res => db.query(`INSERT INTO structutest_assets.unit (locationID) VALUES ('${locationID}')`))
        .then(res => unitID = res.insertId)
        .then(() => done())
        .catch(done);
    })

    it("creates a bill for a newly-match unknown", done => {
      const unknown = {
        scanData: {
          CreditorNumber: '1',
          AccountNumber: '1234',
          CurrentAmount: 12,
          TotalAmount: 12,
          DueDate: '2025-12-31',
        }
      }
      const asset = {
        assetType: 'unit',
        assetID: unitID,
        vendorID: 1,
        expenseID: 1
      }
      Scan.clearUnknownAccount(unknown, asset)
        .then(bill => {
          expect(bill.entryID).to.be.ok;
          expect(bill.amount).to.equal(unknown.scanData.TotalAmount);
          done();
        })
        .catch(done);
    });

    it("moves GFiles for matched unknown", done => {
      const unknown = {
        scanData: {
          CreditorNumber: '1',
          AccountNumber: '1234',
          CurrentAmount: 12,
          TotalAmount: 12,
          DueDate: '2025-12-31',
        }
      }
      const asset = {
        assetType: 'unit',
        assetID: unitID,
        vendorID: 1,
        expenseID: 1
      }
      movedFiles = [];
      Scan.clearUnknownAccount(unknown, asset)
        .then(bill => {
          expect(movedFiles).to.have.length(2);
          expect(movedFiles[0][1].assetType).to.equal('eLedger')
          expect(movedFiles[0][1].assetID).to.equal(bill.entryID)
          expect(movedFiles[1][1].assetType).to.equal('eLedger')
          expect(movedFiles[1][1].assetID).to.equal(bill.entryID)
          done();
        })
        .catch(done);
    });

  })
})
