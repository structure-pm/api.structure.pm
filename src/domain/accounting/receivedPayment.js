import _pick from 'lodash/pick';
import Income from './income';

const ID_FIELD = 'id';
const FIELDS = [
  ID_FIELD,
  'leaseID', 'tenantID', 'comment', 'amount', 'items', 'createdAt', 'modifiedAt',
];

const defaults = {
  amount: 0,
  items: 0,
}

export default function ReceivedPayment(paymentData={}) {
  this.setLines([]);
  Object.assign(this, defaults, _pick(paymentData, FIELDS));
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
  line._dirty = isDirty;
  this._lines.push(line);
  this._updateAggregates();
}

ReceivedPayment.prototype._updateAggregates = function() {
  this.items = this.getLines().length;
  this.amount = this.getLines().reduce((sum, l) => sum + l.amount, 0);
}
