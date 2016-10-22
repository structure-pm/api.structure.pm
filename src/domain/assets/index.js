import request from 'request-promise';
import gcloud from '../gcloud'
import gcloudFile from './gcloudFile.repository';


const Assets = {};
export default Assets;

Assets.saveBufferToGFile = function(gfileData, buffer) {
  const {assetType, assetID, filename, mimeType} = gfileData;
  const cloudFilename = `${assetType}/${assetID}/${filename}`;

  return gcloud.saveBufferToCloud(couldFilename, mimeType, buffer)
    .then(publicUrl => gcloudFile.create({assetType, assetID, filename, mimeType}))
    .then(gfile => gcloudFile.save(gfile));
}
