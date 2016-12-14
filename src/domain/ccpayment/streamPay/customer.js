import {validateRequiredFields, isValidEmail} from '../utils';
import Address from './address';

const requiredFields = ['Email', 'FirstName', 'LastName', 'IsActive']

export default function Customer(options) {
  Object.assign(this,
    { IsActive: true, tokens: [] },
    options
  );

  if (this.Address && !(this.Address instanceof Address)) {
    try {
      this.Address = new Address(this.Address);
    } catch(e) {
      this.Address = undefined;
    }
  }

  validateRequiredFields(this, requiredFields, 'Customer');
  if (!isValidEmail(this.Email)) {
    throw new Error(`Invalid email address: ${this.Email}`);
  }
}
