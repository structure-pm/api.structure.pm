import request from 'request-promise';
import * as db from '../../db';
import gcloud from '../../services/gcloud'
import gcloudFile from './gcloudFile.repository';


const Assets = {};
export default Assets;

Assets.saveBufferToGFile = function(gfileData, buffer, dbOptions) {

  const {assetType, assetID, filename, mimeType} = gfileData;
  const cloudFilename = `${assetType}/${assetID}/${filename}`;

  return gcloud.saveBufferToCloud(cloudFilename, mimeType, buffer)
    .then(publicUrl => gcloudFile.create({assetType, assetID, filename, mimeType}))
    .then(gfile => gcloudFile.save(gfile, dbOptions));
}


Assets.moveGFile = function(fileObjectId, gfileData, dbOptions) {
  dbOptions = dbOptions || {};
  const {assetType, assetID, filename} = gfileData;
  const newFilename = `${assetType}/${assetID}/${filename}`;
  const returnTransaction = !!dbOptions.transaction;
  let currentFilename;


  return Promise.resolve(dbOptions.transaction || db.beginTransaction()).then(t => {

    const options = Object.assign({}, dbOptions, {transaction: t});

    return gcloudFile.get(fileObjectId)
      .then(gfile => {
        currentFilename = `${gfile.assetType}/${gfile.assetID}/${gfile.filename}`;
        gfile.assetType = assetType;
        gfile.assetID = assetID;
        gfile.filename = filename;
        return gcloudFile.save(gfile, options);
      })
      .then(gfile => {
        return gcloud.moveFile(currentFilename, newFilename).return(gfile);
      })
      .tap(gfile => { if (!returnTransaction) db.commit(t); } )
      .catch(err => {
        if (!returnTransaction) return db.rollback(t).throw(err)
        throw err;
      })

  })
}

Assets.getGFilesForAsset = function(assetType, assetID, dbOptions) {
  return gcloudFile.find({assetType, assetID}, dbOptions);
}
