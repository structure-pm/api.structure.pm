import {validateRequiredFields} from '../utils';

const requiredFields = ['AddressLine1', 'City', 'PostalCode', 'RegionName', 'AddressTypeName'];


export default function Address(options) {
  Object.assign(this, options);
  this.AddressTypeName = validateAddressTypeName(this.AddressTypeName || 'Customer Billing');
  validateRequiredFields(this, requiredFields);
}


function validateAddressTypeName(atype) {
  if (['Invoice shipping', 'Invoice Billing', 'Customer Billing'].indexOf(atype) === -1) {
    throw new Error(`Unknown AddressTypeName: ${atype}`);
  }
  return atype;
}
