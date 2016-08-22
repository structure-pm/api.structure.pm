import moment from 'moment';
import Promise from 'bluebird';
import createAccountAssetRepository from './accountAsset.repository';
import createUnknownAccountsRepository from './unknownAccounts.repository';
import createBillRepository from '../expenses/bill.repository';
import createLocationRepository from '../assets/location.repository';
import createUnitRepository from '../assets/unit.repository';

const RESULT_UNKNOWN_ACCOUNT = 'RESULT_UNKNOWN_ACCOUNT';
const RESULT_BILL_CREATED = "RESULT_BILL_CREATED";

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

const ImportScanService = {
  RESULT_UNKNOWN_ACCOUNT,
  RESULT_BILL_CREATED,


  importScan(scanData) {
    scanData = scanData || {};

    let {AccountAssets, UnknownAccounts} = this.repositories;

    return Promise.try(() => {
      this.validateScanData(scanData);
    })
      .then(() => AccountAssets.findByAccountNumber(scanData.AccountNumber, scanData.CreditorNumber))
      .then(asset => {
        if (!asset) {
          // save the data in the unknownAccounts table
          return UnknownAccounts.create({
            accountNumber: scanData.AccountNumber,
            vendorID: scanData.CreditorNumber,
            scanData: scanData
          })
          .then(unknownAccount => ({
            result: this.RESULT_UNKNOWN_ACCOUNT,
            message: "Unknown AccountNumber queued for review",
            data: {unknownAccountId: unknownAccount.id}
          }));

        } else {
          // Create an expense entry for the scanned data
          return this.createBillFromScan(scanData, asset)
          .then(bill => ({
            result: this.RESULT_BILL_CREATED,
            message: "Bill Created",
            data: bill
          }));
        }
      });

  },

  /**
   * validateScanData
   */
  validateScanData(scanData) {
    const requiredFields = ['CreditorNumber', 'AccountNumber', 'CurrentAmount', 'TotalAmount', 'DueDate', ];

    let missingFields = requiredFields.reduce((missing, field) => {
      return (!scanData.hasOwnProperty(field) || !scanData[field])
        ? missing.concat(field)
        : missing;
    }, []);

    if (missingFields.length) {
      throw new Error(`Missing expected fields in scaned data: [${missingFields.join(', ')}]`)
    }

  },

  /**
   * createBillFromScan
   *
   * Creates a bill using data scanned from the original bill and the cached
   * asset data
   */
  createBillFromScan(scanData, assetData, options) {
    return Promise.try(() => {
      let Bills = this.repositories.Bills;
      let billData = {
        createDate: new Date(),
        dueDate: moment(scanData.DueDate).toDate(),
        dateStamp: new Date(),
        vendorID: assetData.vendorID,
        expenseID: assetData.expenseID,
        amount: scanData.CurrentAmount,
        comment: scanData.accountNumber,
      }

      switch (assetData.assetType) {
        case 'manager':
          return Bills.createBillForManager(assetData.assetID, billData, options);
        case 'owner':
          return Bills.createBillForOwner(assetData.assetID, billData, options);
        case 'location':
          return Bills.createBillForLocation(assetData.assetID, billData, options);
        case 'unit':
          return Bills.createBillForUnit(assetData.assetID, billData, options);
        default:
          return Promise.reject(new Error(`Unrecognized assetType '${assetData.assetType}'`));
      }
    });
  },

};




export default function createImportScanService() {
  let repo = Object.create(ImportScanService);
  repo.repositories = {
    Bills: createBillRepository(),
    AccountAssets: createAccountAssetRepository(),
    UnknownAccounts: createUnknownAccountsRepository(),
  }
  return repo;
};
