import createAccountAssetsRepository from './AccountAsset.repository';
import createUnknownAccountsRepository from './UnknownAccounts.repository';
import createImportScanService from './importScan.service';

const RESULT_ASSOCIATE_SUCCESS = 'RESULT_ASSOCIATE_SUCCESS';

const AccountAssetService = {
  RESULT_ASSOCIATE_SUCCESS,

  associateAccount(unknown, vendor, assetType, assetID) {
    return Promise.resolve({})
      .then(ctx => db.beginTransaction() )
      .then(ctx => this.repositories.AccountAsset.create({
          accountNumber: unknown.accountNumber,
          vendorID: vendor.vendorID,
          expenseID: vendor.expenseID,
          assetType: assetType,
          assetID: assetID
        })
      )
      .then(accountAsset => {
        let importScan = createImportScanService();
        let unknownAccountIDs = [];
        return this.repositories.UnknownAccounts.find({
            accountNumber: accountAsset.accountNumber,
            vendorID: accountAsset.vendorID
          })
          .tap(unknownAccounts => unknownAccountIDs = unknownAccounts.map(ua => ua.id))
          .then(unknownAccounts => importScan.createBillFromScan(unknownAccount.scanData, accountAsset) )
          .tap(bills => this.repositories.UnknownAccounts.deleteMultiple(unknownAccountIDs))
      })
      .tap(bills => db.commit().return(bills))
      .then(bills => {
        return {
          result: AccountAssetService.RESULT_ASSOCIATE_SUCCESS,
          bills: bills
        }
      })
      .catch(err => {
        db.rollback().throw(err);
      })
  }
}

export default function createAccountAsset() {
  let repo = Object.create(AccountAssetService);
  repo.repositories.AccountAssets = createAccountAssetsRepository();
  repo.repositories.UnknownAccounts = createUnknownAccountsRepository();
  return repo;
}
