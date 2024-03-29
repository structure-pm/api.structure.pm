import Promise from 'bluebird';
import _pick from 'lodash/pick';
import sqlFromMongo from '../../lib/sqlFromMongo';
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


Repo.find = function(where, options = {}) {
  return Promise.resolve()
    .then(() => {
      const iLedgerTable = `${db.getPrefix()}_income.iLedger`;

      where = _pick(where || {}, Income.Fields);
      if (!Object.keys(where).length) {
        throw new Error("No filters sent to query");
      }

      const whereClause = sqlFromMongo(where);

      const selectSQL = `SELECT
        il.*
        FROM ${iLedgerTable} il
        WHERE ${whereClause}`
      return db.query(selectSQL, options);
    })
    .then(rows => (options.raw) ? rows : rows.map(row => new Income(row)) )
}


Repo.destroy = function(income, options) {
  if (!income.id) return Promise.resolve();
  const iLedgerTable = `${db.getPrefix()}_income.iLedger`;

  const delSQL = `DELETE FROM ${iLedgerTable} WHERE entryID=${db.escape(income.id)}`;
  return db.query(delSQL, options);
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
