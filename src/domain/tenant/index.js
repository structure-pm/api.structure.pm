import Promise from 'bluebird';
import LeaseRepo from './lease.repository';
import TenantRepo from './tenant.repository';
import OwnerRepo from '../assets/owner.repository';
import Accounting from '../accounting';
import * as db from '../../db';


const Tenant = {};
export default Tenant;


Tenant.makePaymentsOnLease = function(lease, paymentData) {
  if (!Array.isArray(paymentData)) paymentData = [paymentData];
  const leaseID = lease.id;
  paymentData = paymentData.map(pd => Object.assign(pd, {
    leaseID   : lease.id,
    adjustment: (pd.isAdjustment) ? 1 : 0,
    feeAdded  : (pd.isFee) ? 1 : 0,
  }))
  const totalRentBalance = paymentData.reduce((sum, pd) => sum + (!pd.isFee) ? pd.amount : 0, 0 );
  const totalFeeBalance = paymentData.reduce((sum, pd) => sum + (pd.isFee) ? pd.amount : 0, 0 );

  // 1. Get the lease
  return LeaseRepo.get(leaseID)
    // 2. Get the owner
    .then(lease => {
      if (!lease) throw new Error(`Lease ${leaseID} not found`);
      return OwnerRepo.get(lease.ownerID).then(owner => [lease, owner]);
    })
    // 3. Get the tenant
    .spread((lease, owner) => {
      if (!owner) throw new Error(`Owner ${lease.ownerID} from lease ${leaseID} not found`);
      return TenantRepo.get(lease.tenantID).then(tenant => [lease, owner, tenant]);
    })
    .spread((lease, owner, tenant) => {
      if (!tenant) throw new Error(`Tenant ${lease.tenantID} from lease ${leaseID} not found`);

      return db.beginTransaction().then(t => Promise
        // 4. Create the iLedger entries for the payments (witin transaction)
        .map(paymentData, pData => Accounting.addIncome(pData, {transaction: t}))
        // 5. Update the owner and tenant balances (within transaction)
        .then(incomes => {
          owner.ledgerBalance += (totalRentBalance + totalFeeBalance);
          tenant.rentBalance -= totalRentBalance;
          tenant.feeBalance -= totalFeeBalance;
          return Promise.all([
            TenantRepo.save(tenant, {transaction: t}),
            OwnerRepo.save(owner, {transaction: t})
          ]).return(incomes); //.spread((tenant, owner) => [lease, owner, tenant, incomes])
        })
        .tap(() => db.commit(t) )
        .catch(err => db.rollback(t).throw(err) )
      );
    })
}

Tenant.getBalance = function(tenantId) {

}

Tenant.updateBalance = function() {

}

Tenant.recalculateBalance = function() {

}
