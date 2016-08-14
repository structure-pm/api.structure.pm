import createUnknownAccounts from '../../domain/scan/unknownAccounts.repository';
import createAccountAssetService from '../../domain/scan/accountAsset.service';
import createImportScanService from '../../domain/scan/importScan.service';

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
  let Vendors = createVendor();
  let AccountAsset = createAccountAssetService();


  let unknownAccount = UnknownAccounts.findById(req.params.unknownAccountID);
  let vendor = unknownAccount.then(ua => Vendors.findById(ua.vendorID));



  Promise.all([unknownAccount, vendor]).spread((unknownAccount, vendor) => {
    if (!unknownAccount) {
      let err = new Error("Not Found");
      err.status = 404;
      return next(err);
    }

    AccountAsset.associateAccount(unknownAccount, vendor, req.body.assetType, req.body.assetID)
      .then(result => {
        res.json(result);
        return next();
      })
      .catch(next);
  })
}
