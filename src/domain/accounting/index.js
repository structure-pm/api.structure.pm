import Promise from 'bluebird';
import IncomeRepo from './income.repository';
import DepositRepo from './deposits.repository';
import PayRepo from './receivedPayment.repository';
import * as db from '../../db';

const Accounting = {};
export default Accounting;

Accounting.addIncome = function(data, dbOptions) {
  const income = IncomeRepo.create(data)
  return IncomeRepo.save(income, dbOptions);
}


Accounting.makeDeposit = function(ownerID, depositDate, deposits) {
  const iLedgerDeposits = Promise.map(
    deposits.filter(d => !!d.entryID),
    entry => IncomeRepo.get(entry.entryID)
  );

  const paymentDeposits = Promise.map(
    deposits.filter(d => !!d.receivedPaymentId),
    payment => PayRepo.get(payment.receivedPaymentId)
  )

  return Promise.all([
    iLedgerDeposits,
    paymentDeposits,
    DepositRepo.getNextDepID(),
    db.beginTransaction()
  ]).spread((entries, payments, depID, transaction) => {

    return Promise.all([
      Promise.map(entries, entry => {
        if (entry.depID) throw new Error(`Entry ${entry.entryID} is already deposited`)
        entry.markDeposited(depID, depositDate);
        return entry;
      }).map(entry => IncomeRepo.save(entry, {transaction}) ),

      Promise.map(payments, payment => {
        if (payment.depID) throw new Error(`Payment ${payment.id} is already deposited`)
        payment.markDeposited(depID, depositDate);
      }).map(payment => PayRepo.save(payment, {transaction}) )
    ])
      .tap(() => db.commit(transaction))
      .catch(err => db.rollback(transaction).throw(err))
      .then(() => ({
        depID: depID,
        count: entries.length + payments.length
      }))
  })

}
