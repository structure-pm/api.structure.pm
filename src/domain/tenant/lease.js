import _pick from 'lodash/pick';

const ID_FIELD = 'leaseID';
const FIELDS = [
  ID_FIELD,
  'tenantID', 'unitID', 'startDate', 'endDate', 'agreement', 'rent', 'assistType',
  'assistPortion', 'assistOtherDesc', 'deposit', 'active', 'comment', 'ach',
  'achCred', 'wireless', 'petRent', 'otherCharge1', 'otherChargeDesc1', 'otherCharge2',
  'otherChargeDesc2'
];

export default function Lease(data) {
  const fields = FIELDS.filter(fld => data[fld] !== undefined);
  data = _pick(data, fields);

  Object.assign(this, data);
  this.id = data[ID_FIELD];
}
