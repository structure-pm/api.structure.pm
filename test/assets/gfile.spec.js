import {expect} from 'chai';
import Promise from 'bluebird';
import * as db from '../../src/db';
import Assets from '../../src/domain/assets';
import GCloudFile from '../../src/domain/assets/gcloudFile.repository';
import config from '../../src/config';
import proxyquire from 'proxyquire';

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
const failingMockGCloud = {
  moveFile: ( filename, newFilename ) => {
    return Promise.reject('sukka');
  },
}
Assets.__Rewire__('gcloud', mockGCloud);


describe("Assets | GFile functions", () => {
  before(() => {
    db.init(config, {force: true});
  });
  after(done => {
    Promise.all([
      db.query(`TRUNCATE TABLE structutest_log.google_cloud_objects`),
    ])
      .then(() => db.end() )
      .then(() => done())
      .catch(done);
  })

  describe("moveGFile()", () => {
    let gFile, gFileID;

    before(done => {
      gFile = GCloudFile.create({
        title: 'test',
        filename: 'test.txt',
        mimeType: 'text/text',
        assetType: 'someAsset',
        assetID: 0,
        finalized: true,
        createdAt: new Date(),
      });
      GCloudFile.save(gFile)
        .tap(f => gFileID = f.id)
        .tap(f => gFile = f)
        .then(() => done())
        .catch(done);
    });

    it("returns a gFile", done => {
      const {assetID, assetType, filename} = gFile;
      Assets.moveGFile(gFile.id, { assetType: 'move1', assetID: '1', filename: 'test1.txt' })
        .then(possibleGFile => {
          expect(possibleGFile.id).to.equal(gFile.id);
          expect(possibleGFile).to.have.property('id');
          expect(possibleGFile).to.have.property('assetID');
          expect(possibleGFile).to.have.property('assetType');
          expect(possibleGFile).to.have.property('filename');
          expect(possibleGFile).to.have.property('mimeType');
          done();
        })
        .catch(done);
    })

    it("alters the db record for the gfile", done => {
      Assets.moveGFile(gFileID, { assetType: 'move2', assetID: '2', filename: 'test2.txt' })
        .then(gFile => {
          expect(gFile.assetType).to.equal('move2');
          expect(gFile.assetID).to.equal('2');
          expect(gFile.filename).to.equal('test2.txt');
          done();
        })
        .catch(done);
    });

    it("makes an api call to gcloud", done => {
      let currentFilename;
      GCloudFile.get(gFileID)
        .tap(gFile => currentFilename = `${gFile.assetType}/${gFile.assetID}/${gFile.filename}` )
        .then(() => Assets.moveGFile(gFileID, { assetType: 'move3', assetID: '3', filename: 'test3.txt' }) )
        .then(gFile => {
          const log = moveFileLog.pop();
          const newFilename = `${gFile.assetType}/${gFile.assetID}/${gFile.filename}`;
          expect(currentFilename).to.not.equal(newFilename);
          expect(log.filename).to.equal(currentFilename);
          expect(log.newFilename).to.equal(newFilename);
          expect(log.filename).to.not.equal(log.newFilename);
          done();
        })
        .catch(done);
    });

    it("rolls back the db updates if gcloud fails", done => {
      Assets.__Rewire__('gcloud', failingMockGCloud);
      let currentFile;
      GCloudFile.get(gFileID)
        .tap(gFile => currentFile = Object.assign({}, gFile) )
        .then(() => Assets.moveGFile(gFileID, { assetType: 'move4', assetID: '4', filename: 'test4.txt' }) )
        .then(gFile => {
          Assets.__Rewire__('gcloud', mockGCloud);
          throw new Error("Should have been a rejection");
        })
        .catch(err => GCloudFile.get(gFileID))
        .then(gFile => {
          expect(gFile).to.deep.equal(currentFile);
          done();
        })
        .catch(done);

    });

  })
})
