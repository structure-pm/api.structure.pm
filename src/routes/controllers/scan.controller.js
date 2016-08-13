import restify from 'restify';
import createUnknownAccounts from '../../domain/scan/unknownAccounts.repository';
import createAccountAssetService from '../../domain/scan/accountAsset.service';
import createImportScanService from '../../domain/scan/importScan.service';

export function importScan(req, res, next) {
  let importScan = createImportScanService();
  importScan.importScan(req.body)
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      console.log(err.stack);
      next(err);
    });
}


export function getUnknownAccounts(req,res,next) {
  let UnknownAccounts = createUnknownAccounts();
  UnknownAccounts.find()
    .then(accounts => {
      res.json(accounts);
    })
    .catch(next);
}

export function associateUnknownAccount(req, res, next) {
  let UnknownAccounts = createUnknownAccounts();
  let Vendors = createVendor();
  let AccountAsset = createAccountAssetService();

  let unknownAccount = UnknownAccounts.findById(req.params.unknownAccountID);
  let vendor = unknownAccount.then(ua => Vendors.findById(ua.vendorID));

  Promise.all([unknownAccount, vendor]).spread((unknownAccount, vendor) => {
    if (!unknownAccount) return next(restify.NotFoundError);

    AccountAsset.associateAccount(unknownAccount, vendor, req.body.assetType, req.body.assetID)
      .then(result => {
        res.json(result);
      })
      .catch(next);
  })
}
