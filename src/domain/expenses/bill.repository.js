import Promise from 'bluebird';
import * as db from '../../db';

const Bill = {
  createBillFromScan(scanData, assetData) {
    return Promise.resolve(1);
  },

  // getBillById(entryID) {
  //   const query = `
  //     SELECT *
  //     FROM ${db.prefix}_expenses.eLedger
  //     WHERE entryID=?`;
  //   db.query(query, [entryID], function(err, rows) {
  //     if (err)
  //   })
  // }
};

export default Bill;
