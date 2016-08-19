import Promise from 'bluebird';
import createUnknownAccounts from '../../domain/scan/unknownAccounts.repository';
import createAccountAssetService from '../../domain/scan/accountAsset.service';
import createImportScanService from '../../domain/scan/importScan.service';
import createVendorRepository from '../../domain/expenses/vendor.repository';

export function importScan(req, res, next) {
  let importScan = createImportScanService();
  importScan.importScan(req.body)
    .then(results => {
      return res.json(results);
    })
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
