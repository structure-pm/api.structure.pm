import Promise from 'bluebird';
import _pick from 'lodash/pick';
import * as db from '../../db';
import ReceivedPayment from './receivedPayment';
import IncomeRepo from './income.repository';

const Repo = {};
export default Repo;



Repo.create = function(data) {
  return new ReceivedPayment(data);
}

Repo.get = function(receivedPaymentId, options) {
  return Promise.all([
    Repo.find({entryID: receivedPaymentId}, options),
    IncomeRepo.find({receivedPaymentId})
  ])
    .spread((receivedPayments, lines) => {
      if (!receivedPayments.length) return null;
      const receivedPayment = receivedPayments[0];

      receivedPayment.setLines(lines);
      return receivedPayment;
    })
}


Repo.find = function(where, options = {}) {

  return Promise.resolve()
    .then(() => {
      where = _pick(where || {}, ReceivedPayment.Fields);
      const receivedPaymentTable = `${db.getPrefix()}_income.receivedPayment`;

      if (!Object.keys(where).length) {
        throw new Error("No filters sent to query");
      }

      const whereClause = Object
        .keys(where)
        .map(key => `${key}=${db.escape(where[key])}`)
        .join(' AND ');

      const selectSQL = `SELECT
          pay.*
        FROM ${receivedPaymentTable} pay
        WHERE ${whereClause}`;

      return db.query(selectSQL, options)
        .map(row => new ReceivedPayment(row));
    })
}

Repo.save = function(receivedPayment, options) {
  return (receivedPayment.id)
    ? updateReceivedPayment(receivedPayment, options)
    : insertReceivedPayment(receivedPayment, options);
}

function updateReceivedPayment(receivedPayment, options) {
  if (!receivedPayment.id) return Promise.reject(new Error('Cannot update receivedPayment with an id'));
  const iLedgerTable = `${db.getPrefix()}_receivedPayment.iLedger`;

  const linesToUpdate = receivedPayment.getDirtyLines();
  const linesToDelete = receivedPayment.getDeletedLines();

  const fields = ReceivedPayment.Fields.filter(fld => receivedPayment[fld] !== undefined);
  const sets = fields.map(fld => `${fld}=${db.escape(receivedPayment[fld])}`).join(',');
  const updateSQL = `UPDATE ${iLedgerTable} SET ${sets} WHERE entryID=${receivedPayment.id}`;

  return Promise.all([
    Promise.map(linesToUpdate, line => IncomeRepo.save(line, options)),
    Promise.map(linesToDelete, line => IncomeRepo.destroy(line, options))
  ])
    .then(() => db.query(updateSQL, options))
    .then(() => Repo.get(receivedPayment.id))

}

function insertReceivedPayment(receivedPayment, options) {
  if (receivedPayment.id) return Promise.reject(new Error('Cannot insert an receivedPayment that already has an id'));
  const iLedgerTable = `${db.getPrefix()}_receivedPayment.iLedger`;

  const lines = receivedPayment.getLines();

  const fields = ReceivedPayment.Fields.filter(fld => receivedPayment[fld] !== undefined);
  const placeholders = fields.map(fld => '?').join(',');
  const values = fields.map(fld => receivedPayment[fld]);
  const insertSQL = `INSERT INTO ${iLedgerTable} (${fields.join(',')}) VALUES (${placeholders})`;

  return Promise.map(lines => IncomeRepo.save(line))
    .then(() => db.query(insertSQL, values, options))
    .then(res => Repo.get(res.insertId));
}
