

export function makePayment(req, res, next) {
  const required = [
    'leaseID', 'dateStamp', 'amount', 'incomeID',
    'isAdjustment', 'isFee', 'comment',
  ]
  const missing = required.filter(fld => !req.body.hasOwnProperty(fld));
  if (missing.length) {
    const err = new Error(`${req.path} is missing required fields ${missing.join(',')}`);
    err.status = 400;
    return next(err);
  }
}
