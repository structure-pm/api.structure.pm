import request from 'request-promise';
import * as db from '../../db';
import gcloud from '../../services/gcloud'
import GFileRepo from './gcloudFile.repository';
import DepositRepo from '../accounting/deposits.repository';
import UnitRepo from './unit.repository';

const Assets = {};
export default Assets;

Assets.getUnit = function(unitID) {
  return UnitRepo.get(unitID);
}

Assets.saveBufferToGFile = function(gfileData, buffer, dbOptions) {

  const gFile = GFileRepo.create(gfileData);
  const cloudFilename = gFile.getAssetFilename();

  return gcloud.saveBufferToCloud(cloudFilename, gFile.mimeType, buffer)
    .then(publicUrl => GFileRepo.save(gFile, dbOptions));
}


Assets.moveGFile = function(fileObjectId, gfileData, dbOptions) {
  dbOptions = dbOptions || {};

  const destinationGFile = GFileRepo.create(gfileData);
  const returnTransaction = !!dbOptions.transaction;

  let currentFilename;


  return Promise.resolve(dbOptions.transaction || db.beginTransaction()).then(t => {

    const options = Object.assign({}, dbOptions, {transaction: t});

    return GFileRepo.get(fileObjectId)
      .then(gfile => {
        currentFilename = gfile.getAssetFilename();
        gfile.assetType = destinationGFile.assetType;
        gfile.assetID = destinationGFile.assetID;
        gfile.filename = destinationGFile.filename;
        return GFileRepo.save(gfile, options);
      })
      .then(gfile => {
        return gcloud.moveFile(currentFilename, destinationGFile.getAssetFilename()).return(gfile);
      })
      .tap(gfile => { if (!returnTransaction) db.commit(t); } )
      .catch(err => {
        if (!returnTransaction) return db.rollback(t).throw(err)
        throw err;
      })

  })
}

Assets.getGFilesForAsset = function(assetType, assetID, dbOptions) {
  return GFileRepo.find({assetType, assetID}, dbOptions);
}

Assets.getOwnerUndeposited = function(ownerID) {
  DepositRepo.getOwnerUndeposited(ownerID)
}
