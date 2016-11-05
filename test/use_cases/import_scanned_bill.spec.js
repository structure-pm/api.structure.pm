import fs from 'fs';
import path from 'path';
import chai, {expect} from 'chai';
import chaiHttp from 'chai-http';
import Promise from 'bluebird';
import * as db from '../../src/db';
import config from '../../src/config';
import app from '../../src/server';
import gCloudService from '../../src/services/gcloud';

chai.use(chaiHttp);


const billData = {
  CreditorNumber: '1',
  AccountNumber: '1234',
  CurrentAmount: 12,
  TotalAmount: 12,
  DueDate: '2025-12-31',
}
const billData2 = {
  CreditorNumber: '1',
  AccountNumber: '1234',
  CurrentAmount: 24,
  TotalAmount: 24,
  DueDate: '2025-12-31',
}

const reScanUploadURL = /https?:\/\/[^\/]*(.*)/;
const pdfFixture = path.join(__dirname, 'fixtures', 'import_scanned_bill.pdf');


const moveFileLog = [];
const saveFileLog = [];
const mockGCloud = {
  moveFile: ( filename, newFilename ) => {
    moveFileLog.push({filename, newFilename});
    return Promise.resolve(newFilename);
  },
  saveBufferToCloud: (cloudFilename, mimeType, buffer) => {
    saveFileLog.push({cloudFilename, mimeType, buffer});
    return Promise.resolve(cloudFilename);
  }
}


describe.only("Use Case | Importing a scanned bill", () => {
  const ownerID = 'testOwn';
  const locationID = 'testLoc';
  let unitID, scanUploadURL;
  let firstUnknown, secondUnknown, createdBills;

  before(done => {
    db.init(config, {force: true});
    expect(db.getPrefix()).to.equal('structutest');
    expect(gCloudService.isMock).to.be.ok;
    return Promise.resolve()
      .then(res => db.query(`INSERT INTO structutest_expenses.vendor (contactID, expenseID) VALUES (1, 123)`))
      .tap(res => {billData.CreditorNumber = res.insertId + ''; billData2.CreditorNumber = res.insertId + '';} )
      .then(()  => db.query(`INSERT INTO structutest_assets.location (locationID, ownerID) VALUES ('${locationID}', '${ownerID}')`) )
      .then(res => db.query(`INSERT INTO structutest_assets.unit (locationID) VALUES ('${locationID}')`))
      .then(res => unitID = res.insertId)
      .then(() => done())
      .catch(done);
  })

  after(done => {
    Promise.all([
      db.query(`TRUNCATE TABLE structutest_expenses.vendor`),
      db.query(`TRUNCATE TABLE structutest_assets.unit`),
      db.query(`TRUNCATE TABLE structutest_assets.location`),
      db.query(`TRUNCATE TABLE structutest_imports.imported_unknown_account`),
      db.query(`TRUNCATE TABLE structutest_imports.imported_account_asset`),
      db.query(`TRUNCATE TABLE structutest_log.google_cloud_objects`),
    ])
      .then(() => db.end() )
      .then(() => done())
      .catch(done);
  });
  it('Pings the server', done => {
    chai.request(app)
      .get('/')
      .end((err, res) => {
        if (err) return done(err);
        done();
      })
  });

  it("posts a first scanned bill", done => {
    chai.request(app)
      .post('/scan')
      .send(billData)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.result).to.equal('RESULT_UNKNOWN_ACCOUNT');
        expect(res.body.data).to.have.property('unknownAccountId');
        expect(res.body).to.have.property('scanUploadURL');

        // Chop off the protocol and host
        scanUploadURL = reScanUploadURL.exec(res.body.scanUploadURL)[1];
        expect(scanUploadURL).to.be.ok;
        done();
      })
  })

  it("uploads a first pdf", done => {
    expect(gCloudService.saveFileLog.length).to.equal(0);
    chai.request(app)
      .post(scanUploadURL)
      .attach('scan', fs.readFileSync(pdfFixture), 'doesnt_matter.pdf')
      .end((err, res) => {
        if (err) return done(err)
        expect(gCloudService.saveFileLog.length).to.equal(1);
        expect(res.body.assetType).to.equal('unknownAccount');
        done();
      })
  });

  it("adds the first unknownAccount to the DB", done => {
    db.query('SELECT * FROM structutest_imports.imported_unknown_account')
      .then(rows => {
        expect(rows.length).to.equal(1);
        expect(rows[0].accountNumber).to.equal(billData.AccountNumber);
        expect(rows[0].vendorID + '').to.equal(billData.CreditorNumber);
        expect(JSON.parse(rows[0].scanData)).to.deep.equal(billData);
        firstUnknown = rows[0];
        done();
      })
      .catch(done);
  });

  it("adds the first gFile record to the DB", done => {
    db.query('SELECT * FROM structutest_log.google_cloud_objects')
      .then(rows => {
        expect(rows.length).to.equal(1);
        expect(rows[0].assetType).to.equal('unknownAccount');
        done();
      })
      .catch(done);
  });

  it("adds a second account with the same account number", done => {
    chai.request(app)
      .post('/scan')
      .send(billData2)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.result).to.equal('RESULT_UNKNOWN_ACCOUNT');
        expect(res.body.data).to.have.property('unknownAccountId');
        expect(res.body).to.have.property('scanUploadURL');

        // Chop off the protocol and host
        scanUploadURL = reScanUploadURL.exec(res.body.scanUploadURL)[1];
        expect(scanUploadURL).to.be.ok;
        done();
      })
  })

  it("uploads a second pdf", done => {
    expect(gCloudService.saveFileLog.length).to.equal(1);
    chai.request(app)
      .post(scanUploadURL)
      .attach('scan', fs.readFileSync(pdfFixture), 'doesnt_matter.pdf')
      .end((err, res) => {
        if (err) return done(err)
        expect(gCloudService.saveFileLog.length).to.equal(2);
        expect(res.body.assetType).to.equal('unknownAccount');
        done();
      })
  });

  it("adds the second unknownAccount to the DB", done => {
    db.query('SELECT * FROM structutest_imports.imported_unknown_account')
      .then(rows => {
        expect(rows.length).to.equal(2);
        expect(rows[1].accountNumber).to.equal(billData2.AccountNumber);
        expect(rows[1].vendorID + '').to.equal(billData2.CreditorNumber);
        expect(JSON.parse(rows[1].scanData)).to.deep.equal(billData2);
        expect(rows[1].id).to.not.equal(firstUnknown.id);
        secondUnknown = rows[1];
        done();
      })
      .catch(done);
  });

  it("adds the second gFile record to the DB", done => {
    db.query('SELECT * FROM structutest_log.google_cloud_objects')
      .then(rows => {
        expect(rows.length).to.equal(2);
        expect(rows[1].assetType).to.equal('unknownAccount');
        done();
      })
      .catch(done);
  });


  it("accepts a request to associate account number to asset", done => {
    chai.request(app)
      .post(`/scan/unknown/${firstUnknown.id}`)
      .send({assetType: 'unit', assetID: unitID})
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.result).to.equal('RESULT_ASSOCIATE_SUCCESS');
        expect(res.body.bills.length).to.equal(2);
        createdBills = res.body.bills;
        done();
      })
  });

  it("deletes the two unknowns", done => {
    db.query('SELECT * FROM structutest_imports.imported_unknown_account WHERE deleted=1')
      .then(rows => {
        expect(rows.length).to.equal(2);
        expect(rows[0].id).to.equal(firstUnknown.id);
        expect(rows[1].id).to.equal(secondUnknown.id);
        done();
      })
      .catch(done);
  });

  it("creates the account asset entries", done => {
    db.query('SELECT * FROM structutest_imports.imported_account_asset')
      .then(rows => {
        expect(rows.length).to.equal(1);
        expect(rows[0].accountNumber).to.equal(firstUnknown.accountNumber);
        expect(rows[0].assetType).to.equal('unit');
        expect(rows[0].assetID).to.equal(unitID+'');
      })
    done();
  });

  it("moves the files on google drive", done => {
    const filename1 = gCloudService.moveFileLog[0].newFilename;
    const filename2 = gCloudService.moveFileLog[1].newFilename;
    const billIds = createdBills.map(b => b.entryID + '')
    expect(gCloudService.moveFileLog.length).to.equal(2);
    expect(filename1.split('/')[0]).to.equal('eLedger');
    expect(filename2.split('/')[0]).to.equal('eLedger');
    expect(billIds).to.include.members([filename1.split('/')[1], filename2.split('/')[1]])
    done();
  });

  it("updates the entries for the gfiles in the db", done => {
    db.query('SELECT * FROM structutest_log.google_cloud_objects')
      .then(rows => {
        const billIds = createdBills.map(b => b.entryID + '')
        expect(rows.length).to.equal(2);
        expect(rows[0].assetType).to.equal('eLedger');
        expect(rows[1].assetType).to.equal('eLedger');
        expect(billIds).to.include.members([rows[0].assetID, rows[1].assetID])
        done();
      })
      .catch(done);
  })






})
