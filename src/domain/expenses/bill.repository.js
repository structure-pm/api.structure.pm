import _isNil from 'lodash/isNil';
import * as db from '../../db';
import Bill from './bill';

import createLocationRepository from '../assets/location.repository';
import createUnitRepository from '../assets/unit.repository';


const Repo = {};
export default Repo;

Repo.save = function(bill, options) {
  return (bill.id) ? updateBill(bill, option) : insertBill(bill,options);
}

Repo.getById = function(id, options) {
  const eLedgerTable = `${db.getPrefix()}_expenses.eLedger`;
  const selectQuery = `SELECT * FROM ${eLedgerTable} WHERE entryID=?`;
  return db.query(selectQuery, [id], options)
    .then(rows => (rows.length) ? new Bill(rows[0]) : null);
}

Repo.create = function(billData) {
  return new Bill(billData);
}


function updateBill(bill, options) {
  if (!bill.id) throw new Error("Cannot update a bill without an id");
  const eLedgerTable = `${db.getPrefix()}_expenses.eLedger`;
  const fields  = bill.FIELDS.filter(fld => bill[fld] !== undefined);
  const sets = fields.map(fld => `${fld}=${db.escape(bill[fld])}`).join(',');
  const updateSQL = `UPDATE ${eLedgerTable} SET ${sets} WHERE entryID=${bill.id}`;
  return db.query(updateSQL, options)
    .then(res => Repo.getById(bill.id, options));
}
function insertBill(bill, options) {
  if (bill.id) throw new Error("Cannot insert a bill that already has an id");
  const eLedgerTable = `${db.getPrefix()}_expenses.eLedger`;
  const fields  = bill.FIELDS.filter(fld => bill[fld] !== undefined);
  const placeHolders = fields.map(fld => '?').join(',');
  const values = fields.map(fld => bill[fld]);
  const insertSQL = `INSERT INTO ${eLedgerTable} (${fields.join(',')}) VALUES (${placeHolders})`;
  return db.query(insertSQL, values, options)
    .then(res => Repo.getById(res.insertId, options));
}
