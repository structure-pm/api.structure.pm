import * as db from '../../db';
import Promise from 'bluebird';

const UnknownAccount = {
  create(uaData, options) {
    const unknownAccountsTable = `${db.getPrefix()}_imports.imported_unknown_account`;
    const insertFields = ['accountNumber', 'vendorID', 'scanData', 'modifiedAt'];
    const placeHolders = insertFields.map(fld => '?').join(',');
    const values = [
      uaData.accountNumber,
      uaData.vendorID,
      JSON.stringify(uaData.scanData),
      new Date()
    ];
    const query = `
      INSERT INTO ${unknownAccountsTable} (
        ${insertFields.join(',')}
      ) VALUES (
        ${placeHolders}
      ); `;
    return db.query(query, values, options);
  },

  findById(id, options) {
    return this.find({id: id}, options)
      .then(uas => (uas && uas.length) ? uas[0] : null);
  },

  /**
   * find
   *
   * SELECT all from the unknownaccounts table
   * For each returned account, parse the JSON text stored in field `scanData`
   */
  find(where, options) {
    options = options || {};
    const unknownAccountsTable = `${db.getPrefix()}_imports.imported_unknown_account`;
    const vendorTable = `${db.getPrefix()}_expenses.vendor`;
    const contactTable = `${db.getPrefix()}_assets.contacts`;

    const query = `
      SELECT * FROM ${unknownAccountsTable} WHERE deleted=0 `;
    const queryWithVendor = `
      SELECT
        ua.*, v.expenseID, c.*,
        c.cname as vendorName
      FROM ${unknownAccountsTable} ua
        LEFT JOIN ${vendorTable} v on v.vendorID=ua.vendorID
        LEFT JOIN ${contactTable} c on c.contactID=v.contactID
      WHERE deleted = 0 `;

    let queryToUse = (options.includeVendor) ? queryWithVendor : query;
    return db.query(queryToUse,options)
      .map(this.rawAccountToObject);
  },

  rawAccountToObject(acct) {
    let {scanData} = acct;
    try {
      scanData = JSON.parse(scanData);
    } catch(e) {}
    return Object.assign({}, acct, {scanData});
  },

  deleteMultiple(ids,options) {
    if (!Array.isArray(ids)) ids = [ids];

    const unknownAccountsTable = `${db.getPrefix()}_imports.imported_unknown_account`;
    const idList = ids.join(',');
    const query = `
      UPDATE ${unknownAccountsTable} SET deleted=1 WHERE id in (${idList}) `;
    return db.query(query,options);
  }
};


export default function createUnknownAccount() {
  let repo = Object.create(UnknownAccount);
  return repo;
}
