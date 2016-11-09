import _pick from 'lodash/pick';

const ID_FIELD = 'ownerID';
const FIELDS = [
  ID_FIELD,
  'nickname', 'lName', 'fName', 'addedWhen', 'endedWhen', 'company',
  'condoAssoc', 'phone', 'fax', 'address', 'email', 'web', 'rate', 'standardMonth',
  'appFeePaper', 'appFeeOnline', 'appFeeEachAddl', 'lateFeeOn', 'lateFeeMaxOwed',
  'lateFeeAmt', 'onlinePayAllow', 'onlinePayDiscount', 'achDiscount', 'statementBalance',
  'ledgerBalance', 'ledgerAdjust', 'openRepairs', 'openTasks', 'repairOnly',
  'reconcileSeparately', 'cTemplateID', 'active', 'managedBy', 'repairedBy',
  'listedBy', 'color', 'premium', 'comment'
];
const REQUIRED_FIELDS = [ 'ownerID', 'lName' ];


export default function Owner(data) {
  const fields = FIELDS.filter(fld => data[fld] !== undefined);
  data = _pick(data, fields);

  const missing = REQUIRED_FIELDS.filter(fld => !data.hasOwnProperty(fld));
  if (missing.length) {
    throw new Error(`Owner is missing fields ${missing.join(',')}`);
  }

  Object.assign(this, data);
  this.id = data[ID_FIELD];
}

Owner.Fields = FIELDS;


Owner.prototype.adjustBalance = function(entry) {
  if (!entry.feeAdded) {
    this.ledgerBalance = (this.ledgerBalance || 0) + entry.amount;
  }
}
