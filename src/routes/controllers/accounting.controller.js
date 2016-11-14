import DepositRepo from '../../domain/accounting/deposits.repository';
import Accounting from '../../domain/accounting';

export function getDeposits(req, res, next) {
  const status = (req.query.status || 'undeposited').toLowerCase();
  const {ownerID, startDate, endDate} = req.query;

  if (['deposited', 'undeposited'].indexOf(status) === -1) {
    const err = new Error(`Unrecognized payment status '${status}'`);
    err.status = 400;
    return next(err);
  }

  if (!ownerID) {
    const error = new Error(`Missing required query parameter 'ownerID'`);
    err.status = 400;
    return next(err);
  }

  if (status === 'undeposited') {
    return DepositRepo.getOwnerUndeposited(ownerID)
      .then(undep => res.json(undep))
      .catch(next);
  } else if (status === 'deposited') {

    if (!startDate || !endDate) {
      const err = new Error('Both startDate and endDate parameters are required');
      err.status = 400;
      return next(err);
    }

    return DepositRepo.getOwnerDeposited(ownerID, startDate, endDate)
      .then(deps => res.json(deps))
      .catch(next);
  }
}


export function makeDeposit(req, res, next) {
  const {depositDate, deposits, ownerID} = req.body;

  const missing = ['depositDate', 'deposits', 'ownerID'].filter(fld => !req.body[fld])
  if (missing.length) {
    const err = new Error(`Missing required field(s) in request body: ${missing.join(',')}`);
    err.status = 400;
    return next(err);
  }

  if (!deposits.length) {
    const err = new Error(`There are no entries to deposit`);
    err.status = 400;
    return next(err);
  }

  Accounting.makeDeposit(ownerID, depositDate, deposits)
    .then(results => res.json(results))
    .catch(next);
}

export function updateDeposit(req, res, next) {
  const {action} = req.query;
  const {depositId} = req.params;

  if (!action) {
    const error = new Error(`Missing required query parameter 'action'`);
    err.status = 400;
    return next(err);
  }

  switch (action) {
    case 'revert':
      return Accounting.revertDeposit(depositId)
        .then(resp => res.json(resp))
        .catch(next);
    default:
      const err = new Error(`Unrecognized action '${action}'`);
      err.status = 400;
      return next(err);
  }
}
