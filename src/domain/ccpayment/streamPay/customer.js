import {validateRequiredFields} from '../utils';
import Address from './address';

const requiredFields = ['Email', 'FirstName', 'LastName', 'IsActive']

export default function Customer(options) {
  Object.assign(this,
    { IsActive: true, tokens: [] },
    options
  );

  this.LastName = this.LastName || '';

  if (!(this.Address instanceof Address)) {
    this.Address = new Address(this.Address);
  }

  validateRequiredFields(this, requiredFields, 'Customer');
}
