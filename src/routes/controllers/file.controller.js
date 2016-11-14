import fs from 'fs';
import _omit from 'lodash/omit';
import Promise from 'bluebird';
import Assets from '../../domain/assets';
import GFileRepo from '../../domain/assets/gcloudFile.repository';
import GCloud from '../../services/gcloud';


export function getFilesForAsset(req, res, next) {
  const assetType = req.params.assetType,
        assetID = req.params.assetID;



  if(!assetType || !assetID) {
    const err = new Error('Missing required query paramters');
    err.status = 400;
    return next(err);
  }

  GFileRepo.find({assetType, assetID})
    .map(gfile => {
      return GCloud.getUrl({filename: gfile.getAssetFilename()})
        .then(url => Object.assign(gfile, {url}))
    })
    .then(gfiles => res.json(gfiles))
    .catch(next);
}

export function searchFiles(req, res, next) {
  next(new Error("not implemented"));
}


export function handleUpload(req, res, next) {

  const missing = ['assetType', 'assetID'].filter(fld => !req.query[fld] && !req.body[fld]);
  if (missing.length) {
    const err = new Error(`Missing required fileds from the querystring or request body: [${missing.join(', ')}]`);
    err.status = 400;
    return next(err);
  }

  if (!req.files.length) {
    const err = new Error('No file was uploaded');
    err.status = 400;
    return next(err);
  }

  // for now, only handle a single file
  const file = req.files[0];

  const assetType   = req.query.assetType || req.body.assetType,
        assetID     = req.query.assetID || req.body.assetID,
        filename    = file.originalname || req.query.filename || req.body.filename,
        description = req.query.description || req.body.description || 'Uploaded File',
        title       = req.query.title || req.body.title || filename,
        localpath   = file.path,
        mimeType    = file.mimetype;



  const gfileData = { assetType, assetID, filename, description, title, mimeType }

  Assets.saveFileToGFile(gfileData, localpath)
    .then(result => res.json(result))
    .catch(next);
}


function deleteLocalFile(localpath) {
  return Promise((resolve, reject) => {
    function callback(err) {
      if (err) return reject(err);
      resolve();
    }
    fs.unlink(localpath, callback);
  })

}
