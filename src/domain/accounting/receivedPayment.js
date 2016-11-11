import Moment from 'moment';
import _pick from 'lodash/pick';
import Income from './income';
import {formatDateForDb} from '../../lib/utils';

const ID_FIELD = 'id';
const FIELDS = [
  ID_FIELD,
  'paymentDate', 'leaseID', 'tenantID', 'accountID', 'locationID', 'invoiceID',
  'comment', 'amount', 'items', 'depID', 'depDate', 'createdAt', 'modifiedAt',
];

const defaults = {
  amount: 0,
  items: 0,
}

export default function ReceivedPayment(paymentData={}) {
  this._lines = [];
  this._deletedLines = [];
  Object.assign(this, defaults, _pick(paymentData, FIELDS));
  this.paymentDate = formatDateForDb(this.paymentDate);

  // To make syncing to the line items a little easier...
  this.dateStamp = this.paymentDate
  this.setLines(paymentData.lines || []);
}

ReceivedPayment.Fields = FIELDS;


ReceivedPayment.prototype.setLines = function(lines) {
  if (!Array.isArray(lines)) lines = [lines];
  this._lines = [];
  this._deletedLines = [];
  lines.forEach(line => this._addLine(line));
}

ReceivedPayment.prototype.getLines = function() {
  return this._lines;
}

ReceivedPayment.prototype.getDirtyLines = function() {
  return this._lines.filter(l => l._dirty);
}

ReceivedPayment.prototype.getDeletedLines = function() {
  return this._deletedLines;
}

ReceivedPayment.prototype.addLine = function(line) {
  this._addLine(line, true);
}

ReceivedPayment.prototype.updateLine = function(lineIdx, line) {
  line = new Income(line);
  line._dirty = true;
  this._lines.splice(lineIdx, 1, line);
  this._updateAggregates();
}

ReceivedPayment.prototype.removeLine = function(lineIdx) {
  const doomed = this._lines.splice(lineIdx, 1);
  this._deletedLines.push(doomed);
  this._updateAggregates();
}

ReceivedPayment.prototype._addLine = function(line, isDirty) {
  line = new Income(line);

  // Line items within a received payment are iLedger entries.  this
  // makes sure that some critical fields are synced between parent
  // and child
  const syncFields = [
    'dateStamp', 'leaseID', 'tenantID', 'accountID', 'locationID',
    'invoiceID', 'comment', 'depID', 'depDate',
  ]

  const updateLine = syncFields.some(fld => line[fld] !== this[fld]);
  syncFields.forEach(fld => line[fld] = this[fld]);

  // The line needs to be updated in the db if we are explicitly told so
  // (isDirty) or if syncing the line to the payment changes the line
  line._dirty = isDirty || updateLine;

  this._lines.push(line);
  this._updateAggregates();
}

ReceivedPayment.prototype._updateAggregates = function() {
  this.items = this.getLines().length;
  this.amount = this.getLines().reduce((sum, l) => sum + l.amount, 0);
}

ReceivedPayment.prototype.markDeposited = function(depID, depositDate) {
  this.depID = depID;
  this.depDate = formatDateForDb(depositDate);
  this.getLines().forEach(line => {
    line.markDeposited(this.depID, this.depDate);
    line._dirty = true;
  });
}
