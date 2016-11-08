import _pick from 'lodash/pick';

const ID_FIELD = 'entryID';
const FIELDS = [
  ID_FIELD,
  'leaseID', 'accountID', 'locationID', 'invoiceID', 'dateStamp', 'amount', 'incomeID',
  'adjustment', 'feeAdded', 'comment', 'deposited', 'depID', 'depDate', 'reconciled',
];
const REQUIRED_FIELDS = [
  'dateStamp', 'amount', 'incomeID'
]

export default function Income(data) {
  const fields = FIELDS.filter(fld => data[fld] !== undefined);
  data = _pick(data, fields);
  data.dateStamp = data.dateStamp || new Date();

  const missing = REQUIRED_FIELDS.filter(fld => !data.hasOwnProperty(fld));
  if (missing.length) {
    throw new Error(`Income is missing fields ${missing.join(',')}`);
  }

  Object.assign(this, data);
  this.id = data[ID_FIELD];
}

Income.Fields = FIELDS;