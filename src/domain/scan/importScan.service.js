import AccountAssetRepository from './accountAsset.repository';
import UnknownAccountsRepository from './unknownAccounts.repository';
import BillRepository from '../expenses/bill.repository';

const RESULT_UNKNOWN_ACCOUNT = 'RESULT_UNKNOWN_ACCOUNT';
const RESULT_BILL_CREATED = "RESULT_BILL_CREATED";

let Repos = {};
/**
 * {
 *   "CustomerName": "Joshua Lyndley",
 *   "CustomerNumber": null,
 *   "CreditorName": "Time Warner Cable",
 *   "CreditorNumber": null,
 *   "AccountNumber": "10303-918592701-8001",
 *   "InvoiceNumber": null,
 *   "CurrentAmount": 60.96,
 *   "PastDueOrOtherCharges": 53.46,
 *   "TotalAmount": 114.42,
 *   "DueDate": "04/23/2016",
 *   "Result": 0
 * }
 */
const ImportScan = {
  RESULT_UNKNOWN_ACCOUNT: RESULT_UNKNOWN_ACCOUNT,
  RESULT_BILL_CREATED: RESULT_BILL_CREATED,

  importScan(scanData) {
    scanData = scanData || {};

    // Is the account in the system?
    return Repos.AccountAsset.getAssetByAccountNumber(scanData.AccountNumber)
      .then(asset => {
        if (!asset) {
          // save the data in the unknownAccounts table
          return Repos.UnknownAccounts.create({
            accountNumber: scanData.accountNumber,
            scanData: scanData
          })
          .then(unknownAccount => ({
            result: ImportScan.RESULT_UNKNOWN_ACCOUNT,
            message: "Unknown AccountNumber queued for review",
            data: {unknownAccountId: unknownAccount.id}
          }));

        } else {
          // Create an expense entry for the scanned data
          return Repos.Bill.create({
            // ?????
          })
            .then(bill => ({
            result: ImportScan.RESULT_BILL_CREATED,
            message: "Bill Created",
            data: {entryID: bill.entryID}
          }));
        }
      })
  },

  repository(repoName, repo) {
    if (!repo) return Repos[repoName];
    return Repos[repoName] = repo;
  },

};

if (!Repos.AccountAsset) {
  ImportScan.repository('AccountAsset', AccountAssetRepository);
}
if (!Repos.UnknownAccounts) {
  ImportScan.repository('UnknownAccounts', UnknownAccountsRepository);
}
if (!Repos.Bill) {
  ImportScan.repository('Bill', BillRepository);
}


export default ImportScan;
