import Promise from 'bluebird';
import Tenant from '../../domain/tenant';
import LeaseRepo from '../../domain/tenant/lease.repository';
import TenantRepo from '../../domain/tenant/tenant.repository';
import Accounting from '../../domain/accounting';

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


export function deletePayment(req, res, next) {
  const {paymentId} = req.params;

  return Tenant.deletePayment(paymentId)
    .then(results => res.json(results))
    .catch(next);
}


export function addFee(req, res, next) {
  return makeLedgerAdjustment('fee', req.params.tenantID, req.body)
    .then(inc => res.json(inc))
    .catch(next);
}

export function addAdjustment(req, res, next) {
  return makeLedgerAdjustment('credit', req.params.tenantID, req.body)
    .then(inc => res.json(inc))
    .catch(next);
}


function makeLedgerAdjustment(type, tenantID, data) {
  const tenant = TenantRepo.get(tenantID).then(tenant => {
    if (!tenant) {
      const err = new Error(`Tenant ${tenantID} not found`);
      err.status = 404;
      throw err;
    }
    return tenant;
  });


  const lease = tenant.then(tenant => tenant.getCurrentLease()).then(lease => {
    if (!lease) {
      const err = new Error(`No current active lease for tenant ${tenantID}`);
      err.status = 400;
      throw err;
    }
    return lease;
  })

  return Promise.all([tenant, lease]).spread((tenant, lease) => {
    data.leaseID = lease.id;
    data.dateStamp = data.dateStamp || new Date();

    if (type === 'fee') {
      return Accounting.addFee(data);
    } else {
      return Accounting.addCredit(data);
    }
  })
}

export function getBalance(req, res, next) {
  const tenantID = req.params.tenantID;
  const tenant = TenantRepo.get(tenantID);

  return tenant.then(tenant => Tenant.getBalances(tenant))
    .then(balances => res.json(balances))
    .catch(next);
}
