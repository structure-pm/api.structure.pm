import Promise from 'bluebird';
import Scan from '../../domain/scan';
import spmAssets from '../../domain/assets';



export function importScan(req, res, next) {
  Scan.importScannedBill(req.body)
    .then(results => res.json(results) )
    .catch(next);
}


export function handleScanUpload(req, res, next) {
  if (!req.file) return next(new Error('No file present'));

  const assetType = req.query.assetType,
        assetID = req.query.assetID,
        filename = req.query.filename,
        filebuffer = req.file.buffer,
        mimeType = req.file.mimetype;

  if (!assetType) return next(new Error('Missing `assetType` from request'));
  if (!assetID) return next(new Error('Missing `assetID` from request'));
  if (!filename) return next(new Error('Missing `filename` from request'));
  if (!filebuffer) return next(new Error('No file was uploaded (no filebuffer)'));

  const gfileData = {
    assetType, assetID, filename, mimeType,
    description: 'Scanned bill pdf'
  }

  spmAssets.saveBufferToGFile(gfileData, filebuffer)
    .then(result => res.json(result))
    .catch(next);
}


export function getUnknownAccounts(req,res,next) {
  const includeVendor = req.query.includeVendor;

  Scan.getAllUnknownAccounts({includeVendor})
    .then(accounts => res.json(accounts) )
    .catch(next)
}

export function associateUnknownAccount(req, res, next) {
  const {unknownAccountID} = req.params;
  const {assetType, assetID} = req.body;

  if (!assetType) {
    let err = new Error("missing assetType");
    err.status = 400;
    return next(err);
  }
  if (!assetID) {
    let err = new Error("missing assetID");
    err.status = 400;
    return next(err);
  }

  Scan.getUnknownAccount(unknownAccountID)
    .then(unknownAccount => {
      if (!unknownAccount) {
        let err = new Error("Not Found");
        err.status = 404;
        return next(err);
      }

      return Scan.matchUnknownAccountToAsset(unknownAccount, assetType, assetID)
    })
    .then(result => res.json(result))
    .catch(next);

}

export function deleteUnknownAccount(req, res, next) {
  let id = req.params.unknownAccountID;

  Scan.deleteUnknownAccount(id)
    .then(() => res.json('ok'))
    .catch(next);
}
