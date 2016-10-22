import Promise from 'bluebird';
import createUnknownAccounts from '../../domain/scan/unknownAccounts.repository';
import createAccountAssetService from '../../domain/scan/accountAsset.service';
import createImportScanService from '../../domain/scan/importScan.service';
import createVendorRepository from '../../domain/expenses/vendor.repository';

import spmAssets from '../../domain/assets';

export function importScan(req, res, next) {
  let importScan = createImportScanService();
  importScan.importScan(req.body)
    .then(results => {
      return res.json(results);
    })
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
  const UnknownAccounts = createUnknownAccounts();
  const includeVendor = req.query.includeVendor;

  UnknownAccounts.find({}, {includeVendor})
    .then(accounts => {
      return res.json(accounts);
    })
    .catch(next)
}

export function associateUnknownAccount(req, res, next) {
  let UnknownAccounts = createUnknownAccounts();
  let Vendors = createVendorRepository();
  let AccountAsset = createAccountAssetService();


  let unknownAccount = UnknownAccounts.findById(req.params.unknownAccountID);
  let vendor = unknownAccount.then(ua => {
    console.log("SEEKING VENDOR", ua.vendorID)
    return Vendors.findById(ua.vendorID)
  });



  Promise.all([unknownAccount, vendor]).spread((unknownAccount, vendor) => {
    if (!unknownAccount) {
      let err = new Error("Not Found");
      err.status = 404;
      return next(err);
    }

    if (!vendor) {
      let err = new Error(`VendorID ${unknownAccount.vendorID} was not found`);
      err.status = 400;
      return next(err);
    }

    return AccountAsset.associateAccount(unknownAccount, vendor, req.body.assetType, req.body.assetID)
      .then(result => {
        res.json(result);
      })
  })
  .catch(next);
}

export function deleteUnknownAccount(req, res, next) {
  let id = req.params.unknownAccountID;
  let UnknownAccounts = createUnknownAccounts();

  UnknownAccounts.destroy(id)
    .then(() => {
      res.json('ok');
    })
    .catch(next);
}
