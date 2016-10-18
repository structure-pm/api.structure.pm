import _pick from 'lodash/pick';
import {validateRequiredFields} from '../utils';

const allFields = ['Amount', 'CheckingInfo', 'CreditCardInfo', 'CustomerId', 'CheckingInfo', 'Custom1', 'Custom2', 'Custom3', 'CustomerGatewayTokenId', 'InvoiceId', 'MerchantGatewayPaymentMethodId', 'TransactionType'];

export default function Transaction(options = {}) {
  Object.assign(this,
    { TransactionType: 'sale' },
    options
  );

  validateRequiredFields(this, ['Amount', 'TransactionType']);

  if (!this.CheckingInfo && !this.CreditCardInfo) {
    throw new Error(`A transaction must define either the 'CheckingInfo' or 'CreditCardInfo' property.`);
  }
}

Transaction.createCCTransaction = function(Amount, CreditCardInfo, options) {
  return new Transaction(Object.assign(
    {Amount, CreditCardInfo},
    options
  ))
}
