


export function InvoiceItem(options) {
  this.AmountEach    = options.AmountEach; // number Required
  this.ItemNumber    = options.ItemNumber; // string(50) Required
  this.Name          = options.Name; // string(200) Required
  this.Quantity      = options.Quantity; // number Required
  this.TotalAmount   = options.TotalAmount; // number Required
}

InvoiceItem.createSimple = function(Name, ItemNumber, Amount) {
  return new InvoiceItem({
    Name: Name,
    AmountEach: Amount,
    Quantity: 1,
    TotalAmount: Amount,
    ItemNumber: ItemNumber
  });
}
