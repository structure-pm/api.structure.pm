import Promise from 'bluebird';
import _pick from 'lodash/pick';
import * as db from '../../db';
import Income from './income';

const Repo = {};
export default Repo;


Repo.create = function(data) {
  return new Income(data);
}

Repo.get = function(id, options) {
  return Repo.find({entryID: id}, options)
    .then(incomes => (incomes && incomes.length) ? incomes[0] : null);
}


Repo.find = function(where, options) {
  return Promise.resolve()
    .then(() => {
      where = _pick(where || {}, Income.Fields);
      const iLedgerTable = `${db.getPrefix()}_income.iLedger`;

      if (!Object.keys(where).length) {
        throw new Error("No filters sent to query");
      }

      const whereClause = Object.keys(where).map(key => `${key}=?`).join(' AND ');
      const values = Object.keys(where).map(key => where[key]);

      const selectSQL = `SELECT
        il.*
        FROM ${iLedgerTable} il
        WHERE ${whereClause}`
      return db.query(selectSQL, values, options);
    })
    .map(row => new Income(row));
}

Repo.save = function(income, options) {
  return (income.id) ? updateIncome(income, options) : insertIncome(income, options);
}

function updateIncome(income, options) {
  if (!income.id) return Promise.reject(new Error('Cannot update income with an id'));
  const fields = Income.Fields.filter(fld => income[fld] !== undefined);
  const sets = fields.map(fld => `${fld}=${db.escape(income[fld])}`).join(',');
  const iLedgerTable = `${db.getPrefix()}_income.iLedger`;
  const updateSQL = `UPDATE ${iLedgerTable} SET ${sets} WHERE entryID=${income.id}`;
  return db.query(updateSQL, options)
    .then(() => Repo.get(income.id));
}

function insertIncome(income, options) {
  if (income.id) return Promise.reject(new Error('Cannot insert an income that already has an id'));
  const fields = Income.Fields.filter(fld => income[fld] !== undefined);
  const placeholders = fields.map(fld => '?').join(',');
  const values = fields.map(fld => income[fld]);
  const iLedgerTable = `${db.getPrefix()}_income.iLedger`;
  const insertSQL = `INSERT INTO ${iLedgerTable} (${fields.join(',')}) VALUES (${placeholders})`;
  return db.query(insertSQL, values, options)
    .then(res => Repo.get(res.insertId));
}
