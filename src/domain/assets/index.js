import request from 'request-promise';
import gcloud from '../gcloud'
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
  const {assetType, assetID, filename} = gfileData;
  const newFilename = `${assetType}/${assetID}/${filename}`;

  return gcloudFile.get(fileObjectId)
    .then(gfile => {
      gfile.assetType = assetType;
      gfile.assetID = assetID;
      gfile.filename = filename;
      return gcloudFile.save(gfile, dbOptions);
    })
    .then(gfile => {
      const gFilename = `${gfile.assetType}/${gfile.assetID}/${gfile.filename}`;
      return gcloud.moveFile(gFilename, newFilename).return(gfile);
    })
}

Assets.getGFilesForAsset = function(assetType, assetID, dbOptions) {
  return gcloudFile.find({assetType, assetID}, dbOptions);
}
