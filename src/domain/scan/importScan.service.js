import moment from 'moment';
import Promise from 'bluebird';
import createAccountAssetRepository from './accountAsset.repository';
import createUnknownAccountsRepository from './unknownAccounts.repository';
import createBillRepository from '../expenses/bill.repository';

import Expenses from '../expenses';

import config from '../../config'

const RESULT_UNKNOWN_ACCOUNT = 'RESULT_UNKNOWN_ACCOUNT';
const RESULT_BILL_CREATED = "RESULT_BILL_CREATED";

const API_HOST = config.host;

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

          return this.createUnknownAccount(scanData)
            .then(unknownAccount => {
              const assetType = 'unknownAccount',
                    assetID = unknownAccount.id;
              return {
                result: this.RESULT_UNKNOWN_ACCOUNT,
                message: "Unknown AccountNumber queued for review",
                data: {unknownAccountId: unknownAccount.id},
                scanUploadURL: uploadUrl(assetType, assetID, scanData.DueDate)
              };
            });
        } else {
          // Create an expense entry for the scanned data
          return this.createBillFromScan(scanData, asset)
            .then(bill => {
              const assetType = 'eLedger',
                    assetID = bill.entryID;
              return {
                result: this.RESULT_BILL_CREATED,
                message: "Bill Created!",
                data: bill,
                scanUploadURL: uploadUrl(assetType, assetID, scanData.DueDate)
              };
            })
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
      let billData = {
        createDate: new Date(),
        dueDate: moment(scanData.DueDate).toDate(),
        vendorID: assetData.vendorID,
        expenseID: assetData.expenseID,
        amount: scanData.CurrentAmount,
        comment: scanData.AccountNumber,
      }

      switch (assetData.assetType) {
        case 'owner':
          return Expenses.createBillForOwner(assetData.assetID, billData, options);
        case 'location':
          return Expenses.createBillForLocation(assetData.assetID, billData, options);
        case 'unit':
          return Expenses.createBillForUnit(assetData.assetID, billData, options);
        default:
          return Promise.reject(new Error(`Unrecognized assetType '${assetData.assetType}'`));
      }
    })
  },

  createUnknownAccount(scanData) {
    let {UnknownAccounts} = this.repositories;

    return UnknownAccounts.create({
      accountNumber: scanData.AccountNumber,
      vendorID: scanData.CreditorNumber,
      scanData: scanData,
    })
  }
};



function scanFilename(dueDate) {
  dueDate = dueDate || moment().format('YYYY-MM-DD-HH-mm');
  dueDate = dueDate.replace(/\//g,'-');
  return `scanned-bill-${dueDate}.pdf`;
}

function uploadUrl(assetType, assetID, dueDate) {
  const proto = 'https';
  const filename = scanFilename(dueDate);
  return `${proto}://${API_HOST}/scan/upload?assetType=${assetType}&assetID=${assetID}&filename=${filename}`
}



export default function createImportScanService() {
  let repo = Object.create(ImportScanService);
  repo.repositories = {
    AccountAssets: createAccountAssetRepository(),
    UnknownAccounts: createUnknownAccountsRepository(),
  }
  return repo;
};
