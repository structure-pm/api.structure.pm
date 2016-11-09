import Promise from 'bluebird';
import LeaseRepo from './lease.repository';
import TenantRepo from './tenant.repository';
import OwnerRepo from '../assets/owner.repository';
import Accounting from '../accounting';
import * as db from '../../db';


const Tenant = {};
export default Tenant;


const postToLedger = function(lease, postData, options) {
  // For reasons that defy rational scrutiny, in Structure, a fee may
  // not have an incomeID.  Explicitly set it to null here if the entry
  // is a fee.
  const entryData = Object.assign({}, postData, {
    leaseID   : lease.id,
    adjustment: (postData.isAdjustment) ? 1 : 0,
    feeAdded  : (postData.isFee) ? 1 : 0,
    incomeID  : (postData.isFee) ? null : postData.incomeID
  });

  return Accounting.addIncome(entryData, options);
}



Tenant.makePaymentsOnLease = function(lease, paymentData) {
  if (!Array.isArray(paymentData)) paymentData = [paymentData];

  const owner = OwnerRepo.get(lease.ownerID);
  const tenant = TenantRepo.get(lease.tenantID);

  return Promise.all([owner, tenant]).spread((owner, tenant) => {
    if (!owner) throw new Error(`Owner ${lease.ownerID} from lease ${lease.id} not found`);
    if (!tenant) throw new Error(`Tenant ${lease.tenantID} from lease ${lease.id} not found`);

    return db.beginTransaction().then(t => {
      return Promise.resolve(paymentData)
        .map(pd => postToLedger(lease, pd, {transaction: t}))
        .map(entry => {
          owner.adjustBalance(entry);
          tenant.adjustBalance(entry);
          return entry;
        })
        .then(entries => {
          return Promise.all([
            OwnerRepo.save(owner, {transaction: t}),
            TenantRepo.save(tenant, {transaction: t})
          ]).return(entries);
        })
        .tap(() => db.commit(t) )
        .catch(err => db.rollback(t).throw(err) )
    })
  })

}



Tenant.getBalance = function(tenantId) {

}

Tenant.updateBalance = function() {

}

Tenant.recalculateBalance = function() {

}
