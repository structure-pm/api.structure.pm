import _pick from 'lodash/pick';
import {validateRequiredFields} from '../utils';

const allFields = ['Amount', 'CheckingInfo', 'CreditCardInfo', 'CustomerId', 'CheckingInfo', 'Custom1', 'Custom2', 'Custom3', 'CustomerGatewayTokenId', 'InvoiceId', 'MerchantGatewayPaymentMethodId', 'TransactionTypeName'];

export default function Transaction(options = {}) {
  Object.assign(this,
    { TransactionTypeName: 'sale' },
    options
  );

  validateRequiredFields(this, ['Amount', 'TransactionTypeName']);
}

Transaction.createCCTransaction = function(Amount, CreditCardInfo, options) {
  return new Transaction(Object.assign(
    {Amount, CreditCardInfo},
    options
  ))
}
