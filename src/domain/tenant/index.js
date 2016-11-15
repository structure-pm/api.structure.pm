import Moment from 'moment';
import Promise from 'bluebird';
import LeaseRepo from './lease.repository';
import TenantRepo from './tenant.repository';
import OwnerRepo from '../assets/owner.repository';
import PayRepo from '../accounting/receivedPayment.repository';
import IncomeRepo from '../accounting/income.repository';
import Accounting from '../accounting';
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



// Tenant.getBalances = function(tenant) {
//   const tenantID = tenant.id || tenant,
//         today = Moment();
//
//   const leases = LeaseRepo.find({tenantID});
//   const leaseIDs = leases.then(leases => leases.map(l => l.leaseID));
//   const feeBalance = leaseIDs.then(leaseIDs =>IncomeRepo.find({
//     leaseID: {$in: leaseIDs},
//     feeAdded: 1
//   }).then(fees)
//
//   const accruedRent = leases.then(leases => leases.reduce((sum,lse) => {
//       const lseEndDate = Moment(lse.endDate,["MM-DD-YYYY", "YYYY-MM-DD"]);
//       const end = (lseEndDate.isBefore(today)) ? lseEndDate : today.endOf('month');
//             start = Moment(lse.startDate,["MM-DD-YYYY", "YYYY-MM-DD"]);
//             rent = parseFloat(lse.rent);
//
//       return sum + (end.diff(start, 'months', true) * rent);
//     }, 0) );
//
//   const rent
//     .then(leases => [leases, leases.map(l => l.leaseID)])
//     .spread(leases, lease)
// }

Tenant.getBalance = function(tenantId) {

}

Tenant.updateBalance = function() {

}

Tenant.recalculateBalance = function() {

}
