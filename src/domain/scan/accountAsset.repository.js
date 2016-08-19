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

  create(scanData, options) {
    options = options || {};
    const accountAssetTable = `${db.getPrefix()}_imports.imported_account_asset`;
    const insertFields = ['accountNumber', 'vendorID', 'expenseID', 'assetType', 'assetID', 'modifiedAt'];
    const values = insertFields.map(fld => scanData[fld]);
    const placeHolders = insertFields.map(fld => '?').join(',');
    const insertQuery = `
      INSERT INTO ${accountAssetTable} (
        ${insertFields.join(',')}
      ) VALUES (
        ${placeHolders}
      ); `;
    const selectQuery = `SELECT * FROM ${accountAssetTable} where id = ? `;

    return db.query(insertQuery, values, options)
      .then(res => db.query(selectQuery, [res.insertId]))
      .then(rows => (rows && rows.length) ? rows[0] : null);
  }
}

export default function createAccountAsset() {
  let repo = Object.create(AccountAssetRepository);
  return repo;
}
