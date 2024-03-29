import * as db from '../../db';
import Promise from 'bluebird';
import createAccountAssetsRepository from './accountAsset.repository';
import createUnknownAccountsRepository from './unknownAccounts.repository';
import createImportScanService from './importScan.service';

const RESULT_ASSOCIATE_SUCCESS = 'RESULT_ASSOCIATE_SUCCESS';
const RESULT_ASSOCIATE_FAIL = 'RESULT_ASSOCIATE_FAIL';

const AccountAssetService = {
  RESULT_ASSOCIATE_SUCCESS,
  RESULT_ASSOCIATE_FAIL,

  associateAccount(unknown, vendor, assetType, assetID) {
    const accountData = {
      assetType,
      assetID,
      accountNumber:unknown.accountNumber,
      vendorID: vendor.vendorID,
      expenseID: vendor.expenseID,
    };


    return db.beginTransaction().then(t => {
      return Promise.try(() => {
          return this.repositories.AccountAssets.create({
            accountNumber: unknown.accountNumber,
            vendorID: vendor.vendorID,
            expenseID: vendor.expenseID,
            assetType: assetType,
            assetID: assetID
          }, {transaction: t});
        })
        .then(accountAsset => this.getUnknownAccounts(accountData.accountNumber, accountData.vendorID) )
        .map(unknownAccount => this.clearUnknownAccount(unknownAccount, accountData, {transaction: t}) )
        .tap(bills => db.commit(t).return(bills))
        .then(bills => {
          return {
            result: AccountAssetService.RESULT_ASSOCIATE_SUCCESS,
            bills: bills
          }
        })
        .catch(err => {
          return db.rollback(t).throw(err);
        })
    })

  },

  getUnknownAccounts(accountNumber, vendorID) {
    return this.repositories.UnknownAccounts.find({ accountNumber, vendorID });
  },

  clearUnknownAccount(unknownAccount, accountData, dbOptions) {
    const assetType = 'eLedger';
    let returnBill;

    return Promise
      .all([
        this.services.importScan.createBillFromScan(unknownAccount.scanData, accountData, dbOptions),
        Assets.getGFilesForAsset('unknownAccount', unknownAccount.id, dbOptions)
      ])
      .spread((bill, files) => {
        returnBill = bill;
        return Promise.map(files, file => {
          const assetID = bill.entryID, filename = file.filename;
          return Assets.moveGFile(file.id, {assetType, assetID, filename}, dbOptions);
        })
      })
      .then(() => this.repositories.UnknownAccounts.destroy(unknownAccount.id))
      .then(() => returnBill);
  },

  // clearUnknownAccounts(accountData, options) {
  //   let unknownAccountIDs = [];
  //   return this.repositories.UnknownAccounts.find({
  //       accountNumber: accountData.accountNumber,
  //       vendorID: accountData.vendorID,
  //     })
  //     .tap(unknownAccounts => unknownAccountIDs = unknownAccounts.map(ua => ua.id))
  //     .map(unknownAccount => this.services.importScan.createBillFromScan(unknownAccount.scanData, accountData, options) )
  //     .tap(bills => this.repositories.UnknownAccounts.deleteMultiple(unknownAccountIDs,options))
  // },

  repositories: {},
  services: {},

}

export default function createAccountAsset() {
  let repo = Object.create(AccountAssetService);
  repo.repositories.AccountAssets = createAccountAssetsRepository();
  repo.repositories.UnknownAccounts = createUnknownAccountsRepository();
  repo.services.importScan = createImportScanService();
  return repo;
}
