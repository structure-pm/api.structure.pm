import LeaseRepo from './lease.repository';
import TenantRepo from './tenant/repository';
import Accounting from './accounting';
import * as db from '../../db';


const Tenant = {};
export default Tenant;


Tenant.makePaymentsOnLease = function(leaseID, paymentData) {
  if (!Array.isArray(paymentData)) paymentData = [paymentData];
  paymentData = paymentData.map(pd => Object.assign(pd, {
    leaseID   : lease.id,
    adjustment: (pd.isAdjustment) ? 1 : 0,
    feeAdded  : (pd.isFee) ? 1 : 0,
  }))

  // 1. Get the lease
  return LeaseRepo.get(leaseID)
    // 2. Get the tenant
    .then(lease => {
      if (!lease) throw new Error(`Lease ${leaseID} not found`);

      return TenantRepo.get(lease.tenantID).then(tenant => [lease, tenant]);
    })
    // 3. Create the iLedger entries for the payments
    .spread((lease, tenant) => {
      if (!tenant) throw new Error(`Tenant ${lease.tenantID} from lease ${leaseID} not found`);
      return db.beginTransaction()
        .then(t => Promise
          .map(paymentData, pData => Accounting.addIncome(incomeData))
          .tap(() => t.commit())
          .catch(err => t.rollback().throw(err)) )
        .then(incomes => [lease, tenant, incomes])
    })
    // 4. Update the Tenant balance
    .spread((lease, tenant, incomes) => {
      // update the tenant balance
    })
}

Tenant.getBalance = function(tenantId) {

}

Tenant.updateBalance = function() {

}

Tenant.recalculateBalance = function() {

}
