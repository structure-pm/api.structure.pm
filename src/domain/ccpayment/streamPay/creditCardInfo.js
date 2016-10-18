import creditCardType from 'credit-card-type';
import {validateRequiredFields} from '../utils';

const allFields = ['CreditCardNumber', 'CreditCardType', 'Cvv2', 'ExpirationDate'];

function getCCType(CreditCardNumber) {
  const ccType = creditCardType(CreditCardNumber || '');
  if (!ccType.length) {
    throw new Error('Cannot recognize CC Type');
  }
  return ccType[0].niceType;
}

export default function CreditCardInfo(options) {
  Object.assign(this,
    { IsActive: true, tokens: [] },
    options
  );

  this.CreditCardType = this.CreditCardType || getCCType(this.CreditCardNumber);

  validateRequiredFields(this, allFields, 'Customer');
}
