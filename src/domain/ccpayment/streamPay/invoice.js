
const _requiredFields = ['BillingAddress', 'CustomerId', 'InvoiceNumber', 'Items'];

export default function Invoice(options) {
  const missing = _requiredFields.filter(fld => !options.hasOwnProperty(fld));
  if (missing.length) {
    throw new Error(`Payment Invoice requires the following missing fields: [${missing.join(',')}]`);
  }


  this.BillingAddress = options.BillingAddress;
  this.ShippingAddress = options.ShippingAddress || options.BillingAddress;
  this.ShippingAmount = options.ShippingAmount || 0;
  this.CustomerId = options.CustomerId;
  this.DueDate = options.DueDate;
  this.Note = options.Note;
  this.InvoiceNumber = options.InvoiceNumber;
  this.Items = options.Items

  // SubTotal, TaxAmount, TotalAmount
  this.calculateInvoiceTotal();
}


Invoice.prototype.addItem = function(Item) {
  this.Items.push(Item);
  this.calculateInvoiceTotal();
}

Invoice.prototype.itemSubtotal = function() {
  return this.Items.reduce((sum, item) => sum + item.TotalAmount);
}
Invoice.prototype.itemTax = function() {
  return 0;
}
Invoice.prototype.calculateInvoiceTotal = function() {
  this.SubTotal = this.itemSubtotal();
  this.TaxAmount = this.itemTax();
  this.TotalAmount = this.SubTotal + this.TaxAmount;
}
