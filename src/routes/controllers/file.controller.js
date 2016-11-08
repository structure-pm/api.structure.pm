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
