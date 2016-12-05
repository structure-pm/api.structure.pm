import Moment from 'moment';
import Promise from 'bluebird';
import LeaseRepo from './lease.repository';
import TenantRepo from './tenant.repository';
import OwnerRepo from '../assets/owner.repository';
import PayRepo from '../accounting/receivedPayment.repository';
import IncomeRepo from '../accounting/income.repository';
import Accounting from '../accounting';
import ReadService from '../accounting/readService';
import {rentPeriods} from '../../lib/utils'
import * as db from '../../db';

import PaymentRepo from '../accounting/receivedPayment.repository';


const Tenant = {};
export default Tenant;



Tenant.receivePayment = function(lease, paymentData) {

  return Promise.all([
    OwnerRepo.get(lease.ownerID),
    TenantRepo.get(lease.tenantID),
    PaymentRepo.create(paymentData)
  ])
    .spread((owner, tenant, payment) => {
      if (!owner) throw new Error(`Owner ${lease.ownerID} from lease ${lease.id} not found`);
      if (!tenant) throw new Error(`Tenant ${lease.tenantID} from lease ${lease.id} not found`);

      return db.beginTransaction().then(t => {

        const newPay = PayRepo.save(payment, {transaction: t});

        const balancesAdjusted = newPay
          .then(payment => payment.getLines())
          .map(iEntry => {
            owner.adjustBalance(iEntry);
            tenant.adjustBalance(iEntry);
            return iEntry;
          });

        const balancesSaved = balancesAdjusted
          .then(() => Promise.all([
              OwnerRepo.save(owner, {transaction: t}),
              TenantRepo.save(tenant, {transaction: t})
            ]) )

        return Promise.all([newPay, balancesAdjusted, balancesSaved])
          .spread((newPay, balancesAdjusted, balancesSaved) => newPay)
          .tap(() => db.commit(t) )
          .catch(err => db.rollback(t).throw(err) )

      });
  })
}

Tenant.deletePayment = function(paymentId) {

  const payment = PaymentRepo.get(paymentId);
  const lease = payment.then(payment => LeaseRepo.get(payment.leaseID));
  const tenant = lease.then(lse => TenantRepo.get(lse.tenantID));
  const owner = lease.then(lse => OwnerRepo.get(lse.ownerID));


  return Promise.all([payment, lease, tenant, owner])
    .then(([payment, lease, tenant, owner]) => {

      return db.beginTransaction().then(t => {

        const balancesAdjusted = newPay
          .then(payment => payment.getLines())
          .map(iEntry => {
            owner.adjustBalance(-1* iEntry);
            tenant.adjustBalance(-1* iEntry);
            return iEntry;
          });

        const balancesSaved = balancesAdjusted
          .then(() => Promise.all([
              OwnerRepo.save(owner, {transaction: t}),
              TenantRepo.save(tenant, {transaction: t})
            ]) )

        payment.setDeleted(true);

        return Promise.all([balancesAdjusted, balancesSaved, PayRepo.save(payment)])
          .then(() => true)
          .tap(() => db.commit(t) )
          .catch(err => db.rollback(t).throw(err) )

      });

    })
}



Tenant.getBalances = function(tenant) {
  const tenantID = tenant.id || tenant,
        today = Moment(),
        dayOfMonth = today.date();

  const feeAdjBalances = ReadService.getFeesAndAdjustmentsForTenant(tenant);
  const paymentBalances = ReadService.getPaymentsForTenant(tenant);
  const leasePeriods = ReadService.getLeasePeriodsForTenant(tenant);
  const rent = tenant.getCurrentLease().then(lse => lse.rent);

  const accruedRent = leasePeriods.then(leases => {
    return leases.reduce((sum,lse) => {
      const lseEndDate = Moment(lse.endDate);
      const start = Moment(lse.startDate);
      const end = (lseEndDate.isBefore(today)) ? lseEndDate : today.endOf('month');
      const rent = parseFloat(lse.rent);
      return sum + (rentPeriods(start, end) * rent);
    }, 0)
  });

  return Promise.all([ feeAdjBalances, paymentBalances, accruedRent, rent ])
  .spread((feeAdjBalances, paymentBalances, accruedRent, rent) => {
    accruedRent = [{incomeID: 1, total: accruedRent}];

    const allBalances = feeAdjBalances.concat(paymentBalances).concat(accruedRent);

    // Combine totals from fees, adjustments, payments and rent to get
    // a final balance for each incomeID
    const balances = allBalances.reduce((all, bal) => {
      if (!all[bal.incomeID]) {
        all[bal.incomeID] = {incomeID: bal.incomeID, name: '', total: 0};
      }

      all[bal.incomeID].name = all[bal.incomeID].name || bal.name;
      all[bal.incomeID].total += bal.total;
      return all;
    }, {})

    const totalRent = balances[1].total;
    const currentRent = (dayOfMonth > 15) ? 0 : Math.min(rent, totalRent);
    const previousRent = totalRent - currentRent;
    const fees = Object.keys(balances).filter(b => b!=='1').map(key => balances[key]);
    const totalDue = [currentRent,previousRent].concat(fees.map(f => f.total))
      .filter(f => f > 0)
      .reduce((sum, f) => sum + f, 0);

    return {totalDue, totalRent, currentRent, previousRent, fees };
  })
}

Tenant.getBalance = function(tenantId) {

}

Tenant.updateBalance = function() {

}

Tenant.recalculateBalance = function() {

}
