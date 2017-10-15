import Moment from 'moment';
import Promise from 'bluebird';
import Assets from '../assets';
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


Tenant.getTenantProfile = function(tenantID) {
  const tenant = TenantRepo.get(tenantID);
  const lease = tenant.then(tenant => tenant.getCurrentLease());
  const unit = lease.then(lse => Assets.getUnit(lse.unitID));

  return Promise.all([tenant, lease, unit])
    .then(([tenant, lease, unit]) => {
      const unitName = (unit.unitName) ? `#${unit.unitName}` : '';
      const address = [unit.streetNum, unit.street, unitName].filter(i=>i).join(' ');
      const profile = Object.assign( tenant.toJSON(), {
        address: address,
        city: unit.city,
        state: unit.state,
        zip: unit.zip
      });
      return profile;
    })
}

/**
 * Receives a multi-line payment for a tenant
 * Mostly used for rent/fee payments
 *
 * @param  {Lease} lease        Lease according to ./lease.js
 * @param  {Object} paymentData Payment Data
 * @return {[type]}             [description]
 */
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

  const payment = PaymentRepo.get(paymentId).then(pm => {
    if (!pm) {
      const err =  new Error(`Payment ${paymentId} not found`);
      err.status = 404;
      throw err;
    }
    return pm;
  });
  const lease = payment.then(payment => LeaseRepo.get(payment.leaseID));
  const tenant = lease.then(lse => TenantRepo.get(lse.tenantID));
  const owner = lease.then(lse => OwnerRepo.get(lse.ownerID));


  return Promise.all([payment, lease, tenant, owner])
    .then(([payment, lease, tenant, owner]) => {

      return db.beginTransaction().then(t => {

        const balancesAdjusted = Promise.resolve(payment.getLines())
          .map(iEntry => {
            owner.adjustBalance(iEntry, false);
            tenant.adjustBalance(iEntry, false);
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

  const lastLease = tenant.getLastLease();
  const feeAdjBalances = ReadService.getFeesAndAdjustmentsForTenant(tenant);
  const paymentBalances = ReadService.getPaymentsForTenant(tenant);
  const rentAndRecurring = lastLease.then(lse => ReadService.getTotalAccruedRentForTenant(tenant, lse));

  function group(accum, coll) {
    return coll.reduce((accum, item) => {
      if (!accum[item.incomeID]) {
        accum[item.incomeID] = {incomeID: item.incomeID, type: item.incomeType, total: 0};
      }
      accum[item.incomeID].total += item.total;
      return accum
    }, accum);
  }

  return Promise
    .all([feeAdjBalances, paymentBalances, rentAndRecurring, lastLease])
    .then(([feeAdjBalances, paymentBalances, rentAndRecurring, lastLease]) => {
      let balances = {};
      balances = group(balances, feeAdjBalances);
      balances = group(balances, paymentBalances);
      balances = group(balances, rentAndRecurring);

      console.log({feeAdjBalances, paymentBalances, rentAndRecurring});

      // ensure that there is a balance for rent (incomeID=1):
      balances[1] = balances[1] || {incomeID: 1, type: 'Rent', total: 0}

      return [balances, lastLease];
    })
    .then(([balances, lastLease]) => {
      const totalRent = balances[1].total;
      const currentRent = (dayOfMonth > 15) ? 0 : Math.min(lastLease.rent, totalRent);
      const previousRent = totalRent - currentRent;
      const fees = Object.keys(balances).filter(b => b!=='1').map(key => balances[key]).filter(b => b.total >0);
      const totalDue = [currentRent,previousRent].concat(fees.map(f => f.total))
        .filter(f => f > 0)
        .reduce((sum, f) => sum + f, 0);

      console.log(balances)
      console.log({totalDue, totalRent, currentRent, previousRent, fees });
      return {totalDue, totalRent, currentRent, previousRent, fees };
    })

}

Tenant.getBalance = function(tenantId) {

}

Tenant.updateBalance = function() {

}

Tenant.recalculateBalance = function() {

}
