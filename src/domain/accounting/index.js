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

Accounting.addFee = function(data, dbOptions) {
  data.adjustment = 0;
  data.feeAdded = 1;
  // data.incomeID = null;
  return Accounting.addIncome(data, dbOptions);
}

Accounting.addCredit = function(data, dbOptions) {
  data.adjustment = 1;
  data.feeAdded = 0;
  // data.incomeID = null;
  return Accounting.addIncome(data, dbOptions);
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
    // DepositRepo.getNextDepID(),
    DepositRepo.createDeposit(depositDate),
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
        return payment;
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

Accounting.revertDeposit = function(depositID) {
  return Promise.all([
    PayRepo.find({depID: depositID}),
    IncomeRepo.find({depID: depositID}),
    db.beginTransaction(),
  ])
    .spread((payments, incomes, transaction) => {

      return Promise.all([
        Promise.map((payments || []), payment => {
          payment.revertDeposit();
          return PayRepo.save(payment, {transaction});
        }),

        Promise.map((incomes || []), income => {
          income.revertDeposit();
          return IncomeRepo.save(income, {transaction})
        })
      ])
      .then(() => DepositRepo.destroyDeposit(depositID, {transaction}))
      .tap(() => db.commit(transaction))
      .catch(err => db.rollback(transaction).throw(err))

    });
}

Accounting.reallocatePayment = function() {
  // TODO
}
