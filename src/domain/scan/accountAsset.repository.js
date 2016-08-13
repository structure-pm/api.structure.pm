import _ from 'lodash';
import * as db from '../../db';


const AccountAssetRepository = {
  findByAccountNumber(accountNumber, vendorID) {
    const accountAssetTable = `${db.getPrefix()}_imports.imported_account_asset`;
    const query = `
      SELECT *
      FROM ${accountAssetTable}
      WHERE accountNumber=? and vendorID=?`;

    return db.query(query, [accountNumber, vendorID])
      .then(res => {
        if (res.length) return res[0]
        return null;
      });
  },

  create(scanData) {
    const accountAssetTable = `${db.getPrefix()}_imports.imported_account_asset`;
    const insertFields = ['accountNumber', 'vendorID', 'expenseID', 'assetType', 'assetID', 'modifiedAt'];
    const values = _.pick(scanData, insertFields);
    const query = `
      INSERT INTO ${accountAssetTable} (
        ${insertFields.join(',')}
      ) VALUES (
        ?, ?, ?, ?, ?, ?
      ); `;

    return db.query(query, values);
  }
}

export default function createAccountAsset() {
  let repo = Object.create(AccountAssetRepository);
  return repo;
}
