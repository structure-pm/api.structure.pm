import Promise from 'bluebird';
import Moment from 'moment';
import config from '../../config'
import BillScan from './billScan';
import Expenses from '../expenses';
import Assets from '../assets';
import * as db from '../../db';
import createAccountAssetRepository from './accountAsset.repository';
import createUnknownAccountsRepository from './unknownAccounts.repository';

const AccountAssetRepo = createAccountAssetRepository();
const UnknownAccountRepo = createUnknownAccountsRepository();
const API_HOST = config.host;

const Scan = {};
export default Scan;


Scan.importScannedBill = function(scanData) {
  const scan = Promise.try(() => new BillScan(scanData) );
  const asset = scan.then(scan => AccountAssetRepo.findByAccountNumber(scan.AccountNumber, scan.CreditorNumber));

  return Promise.all([scan, asset])
    .spread((scan, asset) => {
      return (asset)
        ? Scan.createBillFromScan(scan, asset)
          .then(bill => ({
            result: 'RESULT_BILL_CREATED',
            message: "Bill Created!",
            data: bill,
            scanUploadURL: uploadUrl('eLedger', bill.entryID, scan.DueDate)
          }))
        : Scan.createUnknownAccount(scan)
          .then(unknownAccount => ({
            result: 'RESULT_UNKNOWN_ACCOUNT',
            message: "Unknown AccountNumber queued for review",
            data: {unknownAccountId: unknownAccount.id},
            scanUploadURL: uploadUrl('unknownAccount', unknownAccount.id, scan.DueDate)
          }))
    })
}

Scan.createBillFromScan = function(scan, asset, options={}) {
  return Promise.try(() => {
    console.log("MOMENT THIS", scan.DueDate);
    let billData = {
      createDate: new Date(),
      dueDate: Moment(scan.DueDate).toDate(),
      vendorID: asset.vendorID,
      expenseID: asset.expenseID,
      amount: scan.CurrentAmount,
      comment: scan.AccountNumber,
    }

    switch (asset.assetType) {
      case 'owner':
        return Expenses.createBillForOwner(asset.assetID, billData, options);
      case 'location':
        return Expenses.createBillForLocation(asset.assetID, billData, options);
      case 'unit':
        return Expenses.createBillForUnit(asset.assetID, billData, options);
      default:
        return Promise.reject(new Error(`Unrecognized assetType '${asset.assetType}'`));
    }
  });
}

Scan.matchUnknownAccountToAsset = function(unknownAccount, assetType, assetID) {
  const {accountNumber, vendorID, expenseID} = unknownAccount;
  const accountAsset = { accountNumber, assetType, assetID, vendorID, expenseID, };

  return db.beginTransaction().then(t => {

    return Promise.all([
      Scan.createAccountAsset(accountAsset, {transaction: t}),
      Scan.getUnknownsForAccount(accountNumber, vendorID),
    ])
      .spread((asset, unknowns) => Promise.map(unknowns,
        unknown => clearUnknownAccount(unknown, asset, {transaction: t}))
      )
      .tap(bills => db.commit(t).return(bills))
      .then(bills => {
        return {
          result: 'RESULT_ASSOCIATE_SUCCESS',
          bills: bills
        }
      })
      .catch(err => {
        return db.rollback(t).throw(err);
      })

  });
}

Scan.createUnknownAccount = function(scan) {
  return UnknownAccountRepo.create({
    accountNumber: scan.AccountNumber,
    vendorID: scan.CreditorNumber,
    scanData: JSON.parse(JSON.stringify(scan)),
  });
}

Scan.createAccountAsset = function(accountAsset, options) {
  return AccountAssetRepo.create(accountAsset, options);
}

Scan.getUnknownsForAccount = function(accountNumber, vendorID) {
  return UnknownAccountRepo.find({ accountNumber, vendorID });
};

Scan.getAllUnknownAccounts = function(options) {
  return UnknownAccountRepo.find({}, options);
}

Scan.getUnknownAccount = function(id) {
  return UnknownAccountRepo.findById(id);
}

Scan.deleteUnknownAccount = function(id) {
  return UnknownAccountRepo.destroy(id);
}


export function clearUnknownAccount(unknown, asset, dbOptions) {
  const assetType = 'eLedger';
  let returnBill;

  return Promise
    .all([
      Scan.createBillFromScan(unknown.scanData, asset, dbOptions),
      Assets.getGFilesForAsset('unknownAccount', unknown.id, dbOptions)
    ])
    .spread((bill, files) => {
      returnBill = bill;
      console.log("NEED TO MOVE FILES", files);
      const assetID = bill.entryID;
      return Promise.map(files, file => {
        const filename = file.filename;
        return Assets.moveGFile(file.id, {assetType, assetID, filename}, dbOptions);
      })
    })
    .then(() => UnknownAccountRepo.destroy(unknown.id, dbOptions))
    .then(() => returnBill);
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
