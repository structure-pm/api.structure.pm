import Promise from 'bluebird';
import _pick from 'lodash/pick';
import LeaseRepo from './lease.repository';

function sortLeaseByStartDate(a, b) {
  return new Date(b.startDate) - new Date(a.startDate);
}

const ID_FIELD = 'tenantID';
const FIELDS = [
  ID_FIELD,
  'ownerID', 'firstName', 'lastName', 'phone', 'altPhone', 'bDate', 'ss', 'license',
  'married', 'email', 'fNameSpouse', 'lNameSpouse', 'bDateSpouse', 'ssSpouse',
  'licenseSpouse', 'presentAddress', 'lengthPresAdd', 'rentPresAdd', 'landlordName',
  'landlordPhone', 'landlordAdd', 'rentPaid', 'noticeGiven', 'askedToLeave', 'numOccupants',
  'nameAddlOcc1', 'bDateAddlOcc1', 'relAddlOcc1', 'nameAddlOcc2', 'bDateAddlOcc2',
  'relAddlOcc2', 'nameAddlOcc3', 'bDateAddlOcc3', 'relAddlOcc3', 'nameAddlOcc4',
  'bDateAddlOcc4', 'relAddlOcc4', 'pets', 'petsDetail', 'empName', 'empSince',
  'empAddress', 'occupation', 'income', 'supervisor', 'empPhone', 'empNameSpouse',
  'empSinceSpouse', 'empAddressSpouse', 'occupationSpouse', 'incomeSpouse', 'supervisorSpouse',
  'empPhoneSpouse', 'emerName', 'emerRel', 'emerPhone', 'suedBills', 'bankrupt',
  'brokenLease', 'evicted', 'felony', 'financialNotes', 'comment', 'appliedFor',
  'referredBy', 'appliedWhen', 'uN', 'pW', 'rentBalance', 'feeBalance',
  'prevBalance', 'permanentNote',
];

export default function Tenant(data) {
  const fields = FIELDS.filter(fld => data[fld] !== undefined);
  data = Object.assign({}, {
    rentBalance: 0,
    feeBalance: 0,
  }, _pick(data, fields));

  Object.assign(this, data);
  this.id = data[ID_FIELD];
}

Tenant.Fields = FIELDS;

function logLeases(lses) {
  console.log("lses", lses.map(lse => [lse.leaseID, lse.startDate]));
}

Tenant.prototype.getCurrentLease = function() {
  if (this._currentLease) return Promise.resolve(this._currentLease);
  return LeaseRepo.find({tenantID: this.id, active: 1})
    .then(leases => (leases || leases.length) ? leases[0] : null)
    .tap(lease => this._currentLease = lease)
}

Tenant.prototype.getLastLease = function() {
  return LeaseRepo.find({tenantID: this.id})
    .then(leases => leases.sort(sortLeaseByStartDate))
    .then(leases => (leases || leases.length) ? leases[0] : null);
}


Tenant.prototype.adjustBalance = function(entry, add=true) {
  const mult = (add) ? 1 : -1;
  if (entry.feeAdded) {
    this.feeBalance = (this.feeBalance || 0) + (mult * entry.amount);
  } else {
    this.rentBalance = (this.rentBalance || 0) - (mult * entry.amount);
  }
}

Tenant.prototype.toJSON = function() {
  return _pick(this, FIELDS);
}
