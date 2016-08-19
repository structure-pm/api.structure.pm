import * as db from '../../db';



const Bill = {


  findById(entryID) {
    const eLedgerTable = `${db.getPrefix()}_expenses.eLedger`;
    const query = `
      SELECT *
      FROM ${eLedgerTable}
      WHERE entryID=?`;
    return db.query(query, [entryID])
      .spread((rows, meta) => (rows.length) ? rows[0] : null )
  },

  create(billData, options) {
    const eLedgerTable = `${db.getPrefix()}_expenses.eLedger`;
    const insertFields = [
      'managerID',
      'ownerID',
      'locationID',
      'unitID',
      'createDate',
      'dueDate',
      'dateStamp',
      'vendorID',
      'expenseID',
      'amount',
    ];
    const values = insertFields.map(fld => billData[fld]);
    const placeHolders = insertFields.map(fld => '?').join(',');
    const insertQuery = `
      INSERT INTO ${eLedgerTable} (
        ${insertFields.join(',')}
      ) VALUES (
        ${placeHolders}
      )`;
    const selectQuery = `SELECT * FROM ${eLedgerTable} WHERE entryID=?`;
    return db.query(insertQuery, values, options)
      .then(res => {
        if (res.insertId) {
          return db.query(selectQuery, [res.insertId])
        } else {
          return res
        }
      });
  }
};

export default function createBill() {
  let repo = Object.create(Bill);
  return repo;
}
