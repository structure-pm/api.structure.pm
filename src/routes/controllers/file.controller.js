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

  const missing = ['assetType', 'assetID', 'filename'].filter(fld => !req.query[fld] && !req.body[fld]);
  if (missing.length) {
    const err = new Error(`Missing required fileds from the querystring: ${missing.join(', ')}`);
    err.status = 400;
    return next(err);
  }

  if (!res.files.upload.length) {
    const err = new Error('Missing file. Files to be uploaded should use the `upload` field name in the request.');
    err.status = 400;
    return next(err);
  }

  const assetType   = req.query.assetType || req.body.assetType,
        assetID     = req.query.assetID || req.body.assetID,
        filename    = req.query.filename || req.body.filename,
        description = req.query.description || req.body.description || 'Uploaded File',
        title       = req.query.title || req.body.title || filename,
        filebuffer  = req.files.upload[0].buffer,
        mimeType    = req.file.upload[0].mimetype;


  const gfileData = { assetType, assetID, filename, description, title, mimeType }

  Assets.saveBufferToGFile(gfileData, filebuffer)
    .then(result => res.json(result))
    .catch(next);
}
