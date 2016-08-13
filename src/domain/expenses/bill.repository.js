import * as db from '../../db';



const Bill = {


  findById(entryID) {
    const eLedgerTable = `${db.getPrefix()}_expenses.eledger`;
    const query = `
      SELECT *
      FROM ${eLedgerTable}
      WHERE entryID=?`;
    return db.query(query, [entryID])
      .spread((rows, meta) => (rows.length) ? rows[0] : null )
  },

  create(billData) {
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
  }
};

export default function createBill() {
  let repo = Object.create(Bill);
  return repo;
}
