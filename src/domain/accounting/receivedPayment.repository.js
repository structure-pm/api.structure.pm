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
    Repo.find({id: receivedPaymentId}, options),
    IncomeRepo.find({receivedPaymentId}, {raw: true})
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
  if (!receivedPayment.getLines().length) {
    return Promise.reject(new Error('Cannot save a receivedPayment with 0 payment lines'));
  }

  if (receivedPayment.id && receivedPayment.isDeleted()) {
    return deleteReceivedPayment(receivedPayment, options);
  } else {
    return (receivedPayment.id)
      ? updateReceivedPayment(receivedPayment, options)
      : insertReceivedPayment(receivedPayment, options);
  }
}

function updateReceivedPayment(receivedPayment, options) {
  if (!receivedPayment.id) return Promise.reject(new Error('Cannot update receivedPayment with an id'));
  const receivedPaymentTable = `${db.getPrefix()}_income.receivedPayment`;

  const linesToUpdate = receivedPayment.getDirtyLines();
  const linesToDelete = receivedPayment.getDeletedLines();

  const fields = ReceivedPayment.Fields.filter(fld => receivedPayment[fld] !== undefined);
  const sets = fields.map(fld => `${fld}=${db.escape(receivedPayment[fld])}`).join(',');
  const updateSQL = `UPDATE ${receivedPaymentTable} SET ${sets} WHERE id=${receivedPayment.id}`;

  return Promise.all([
    Promise.map(linesToUpdate, line => IncomeRepo.save(line, options)),
    Promise.map(linesToDelete, line => IncomeRepo.destroy(line, options))
  ])
    .then(() => db.query(updateSQL, options))
    .then(() => Repo.get(receivedPayment.id, options))

}

function insertReceivedPayment(receivedPayment, options) {
  if (receivedPayment.id) return Promise.reject(new Error('Cannot insert an receivedPayment that already has an id'));
  const receivedPaymentTable = `${db.getPrefix()}_income.receivedPayment`;

  const lines = receivedPayment.getLines();

  const fields = ReceivedPayment.Fields.filter(fld => receivedPayment[fld] !== undefined);
  const placeholders = fields.map(fld => '?').join(',');
  const values = fields.map(fld => receivedPayment[fld]);
  const insertSQL = `INSERT INTO ${receivedPaymentTable} (${fields.join(',')}) VALUES (${placeholders})`;

  const insert = db.query(insertSQL, values, options);
  const insertLines = insert
    .then(insert => lines.map(line => line.attachToPayment(insert.insertId)))
    .map(line => IncomeRepo.save(line))

  return Promise.all([insert, insertLines])
    .spread((insert, insertLines) => Repo.get(insert.insertId, options))
}


function deleteReceivedPayment(receivedPayment, options) {
  const receivedPaymentTable = `${db.getPrefix()}_income.receivedPayment`;
  const lines = receivedPayment.getLines().filter(l => l.id);

  const deletePaymentSQL = `DELETE FROM ${receivedPaymentTable} WHERE id=?`;

  return Promise.all([
    Promise.map(lines, line => IncomeRepo.destroy(line, options)),
    db.query(deletePaymentSQL, [receivedPayment.id], options)
  ]);

}
