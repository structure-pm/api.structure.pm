import DepositRepo from '../../domain/accounting/deposits.repository';
import Accounting from '../../domain/accounting';

export function getDeposits(req, res, next) {
  const status = (req.query.status || 'undeposited').toLowerCase();

  if (['deposited', 'undeposited'].indexOf(status) === -1) {
    const err = new Error(`Unrecognized payment status '${status}'`);
    err.status = 400;
    return next(err);
  }

  if (status === 'undeposited') {
    return DepositRepo.getOwnerUndeposited(req.params.ownerID)
      .then(undep => res.json(undep))
      .catch(next)
  } else {
    return res.json([]);
  }
}


export function makeDeposit(req, res, next) {
  const {depositDate, deposits} = req.body;
  const {ownerID} = req.params;

  const missing = ['depositDate', 'deposits'].filter(fld => !req.body[fld])
  if (missing.length) {
    const err = new Error(`Missing required field ${missing.join(',')}`);
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
