import request from 'request-promise';
import gcloud from '../gcloud'
import gcloudFile from './gcloudFile.repository';


const Assets = {};
export default Assets;

Assets.saveBufferToGFile = function(gfileData, buffer) {
  const {assetType, assetID, filename, mimeType} = gfileData;
  const cloudFilename = `${assetType}/${assetID}/${filename}`;

  return gcloud.saveBufferToCloud(cloudFilename, mimeType, buffer)
    .then(publicUrl => gcloudFile.create({assetType, assetID, filename, mimeType}))
    .then(gfile => gcloudFile.save(gfile));
}


Assets.moveGFile = function(fileObjectId, gfileData) {
  const {assetType, assetID, filename} = gfileData;
  const newFilename = `${assetType}/${assetID}/${filename}`;
  let filename;

  return gcloudFile.get(fileObjectId)
    .then(gfile => {
      filename = `${gfile.assetType}/${gfile.assetID}/${gfile.filename}`;
      gfile.assetType = assetType;
      gfile.assetID = assetID;
      gfile.filename = filename;
      return gcloudFile.save(gfile);
    })
    .then(gfile => {
      return gcloud.moveFile(filename, newFilename);
    })
}
