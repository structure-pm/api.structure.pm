import Promise from 'bluebird';
import Tenant from '../../domain/tenant';
import LeaseRepo from '../../domain/tenant/lease.repository';

export function makePayments(req, res, next) {
  const required = [
    'leaseID', 'dateStamp', 'amount', 'incomeID',
    'isAdjustment', 'isFee', 'comment',
  ]

  const payments = (Array.isArray(req.body)) ? req.body : [req.body];

  for (let i = 0; i < payments.length; i++) {
    const missing = required.filter(fld => !payments[i].hasOwnProperty(fld));
    if (missing.length) {
      const err = new Error(`${req.path} is missing required fields ${missing.join(',')}`);
      err.status = 400;
      return next(err);
    }
  }

  const leases = payments.map(p => p.leaseID);
  const allSame = !!leases.reduce((prev, lse) => (prev === lse) ? lse : false);
  if (!allSame) {
    const err = new Error(`Batched payments must be for the same lease`);
    err.status = 400;
    return next(err);
  }
  const leaseID = (leases.length) ? leases[0] : null;

  LeaseRepo.get(leaseID)
    .then(lease => Tenant.makePaymentsOnLease(lease, payments))
    .then(results => res.json(results))
    .catch(next);
}
