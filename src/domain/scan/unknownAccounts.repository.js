import * as db from '../../db';


const UnknownAccount = {
  create(uaData) {
    const unknownAccountsTable = `${db.getPrefix()}_imports.imported_unknown_account`;
    const insertFields = ['accountNumber', 'vendorID', 'scanData'];
    const values = [
      uaData.accountNumber,
      uaData.vendorID,
      JSON.stringify(uaData.scanData)
    ];
    const query = `
      INSERT INTO ${unknownAccountsTable} (
        ${insertFields.join(',')}
      ) VALUES (
        ?, ?, ?
      ); `;
    return db.query(query, values);
  },

  /**
   * find
   *
   * SELECT all from the unknownaccounts table
   * For each returned account, parse the JSON text stored in field `scanData`
   */
  find() {
    const unknownAccountsTable = `${db.getPrefix()}_imports.imported_unknown_account`;
    const query = `
      SELECT * FROM ${unknownAccountsTable}; `;
    return db.query(query)
      .then(res => res[0])
      .map(this.rawAccountToObject);
  },

  rawAccountToObject(acct) {
    let {scanData} = acct;
    try {
      scanData = JSON.parse(scanData);
    } catch(e) {}
    return Object.assign({}, acct, {scanData});
  }
};


export default function createUnknownAccount() {
  let repo = Object.create(UnknownAccount);
  return repo;
}
