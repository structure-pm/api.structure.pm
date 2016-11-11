import Promise from 'bluebird';
import Tenant from '../../domain/tenant';
import LeaseRepo from '../../domain/tenant/lease.repository';
import TenantRepo from '../../domain/tenant/tenant.repository';

export function receivePayment(req, res, next) {
  const missing = ['paymentDate', 'lines'].filter(fld => !req.body[fld]);
  if (missing.length) {
    const err = new Error(`Missing required fields [${missing.join(',')}]`);
    err.status = 400;
    return next(err);
  }

  if (!req.body.lines.length) {
    const err = new Error(`Payments require at lease one line item`);
    err.status = 400;
    return next(err);
  }


  const lease = (req.query.leaseID)
    ? LeaseRepo.get(req.query.leaseID)
    : TenantRepo.get(req.params.tenantID)
        .then(tenant => tenant.getCurrentLease());

  return lease
    .then(lease => {
      if (''+lease.tenantID !== req.params.tenantID) {
        console.log("MISMATCH", lease.tenantID, req.params.tenantID)
        const err = new Error("Lease does not match tenant");
        err.status = 400;
        throw err
      }
      return lease;
    })
    .then(lease => Tenant.receivePayment(lease, req.body))
    .then(response => res.json(response))
    .catch(next);
}
