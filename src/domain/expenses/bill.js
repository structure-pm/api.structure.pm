import _pick from 'lodash/pick';

const fields = [
  'entryID', 'recurringID', 'scheduledID', 'managerID', 'ownerID', 'locationID',
  'unitID', 'createDate', 'dueDate', 'dateStamp', 'vendorID', 'expenseID', 'amount',
  'payment', 'invoiceID', 'invoice', 'payMethod', 'checkID', 'check', 'reconciled',
  'comment'
];

export default function Bill(billData) {
  Object.assign(this, _pick(billData, fields));
  this.id = this.entryID;
}

Bill.prototype.FIELDS = fields;
