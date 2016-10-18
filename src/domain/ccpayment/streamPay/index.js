import path from 'path';
import request from 'request-promise';
import _pick from 'lodash/pick';
import {validateRequiredFields} from '../utils';

import Transaction from './transaction';
import Customer from './customer';
import Address from './address';
import Invoice from './invoice';
import InvoiceItem from './invoiceItem';
import CreditCardInfo from './creditCardInfo';

export {Transaction, Customer, Address, CreditCardInfo, Invoice};


export default function Api(config = {}) {

  this.base_uri = config.base_uri;
  this.isDemo = (config.hasOwnProperty('demo')) ? config.demo : true;
  this.StreamPayApiKey = config.StreamPayApi;
  this.Origin = config.Origin;
  this.CreditCardMethodId = config.CreditCardMethodId;

  this.defaultHeaders = {
    Accept: 'application/json, text/plain, */*',
    "Content-Type": 'application/json',
    StreamPayApi: this.StreamPayApiKey,
    Origin: this.Origin,
  };

  this.defaultRequestOptions = {
    headers: this.defaultHeaders,
  }

}


// =============================================================================
// ==== REQUESTS
// =============================================================================
Api.prototype.buildURL = function(resource) {
  return `${this.base_uri}/${resource}`;
}

Api.prototype.request = function(method, uri, options = {}) {
  const qs = Object.assign({}, options.qs || {}, {demo: this.isDemo});
  const json = true;

  console.log(Object.assign(
    { method, uri },
    this.defaultRequestOptions,
    options,
    {qs, json}      // required Request options
  ))

  return request(Object.assign(
    { method, uri },
    this.defaultRequestOptions,
    options,
    {qs, json}      // required Request options
  )).catch(err => {
    throw this.formatErrorResponse(err);
  } );
}

Api.prototype.get = function(uri, options) { return this.request('GET', uri, options); }

Api.prototype.post = function(uri, data, options) {
  if (typeof data === 'object') data = JSON.stringify(data);
  options = Object.assign({}, options, {body: data});

  return this.request('POST', uri, options)
}

Api.prototype.formatErrorResponse = function(errResponse) {
  if (!errResponse.error || !errResponse.error.Reason) return errResponse;

  const message = `${errResponse.error.Reason} - ${errResponse.error.Detail}`;
  const errCode = errResponse.error.ErrorCode;
  const err = new Error(message);
  err.status = errResponse.statusCode;
  err.ErrorCode = errCode;
  return err;
}

// =============================================================================
// ==== STREAMPAY METHODS
// =============================================================================
Api.prototype.listPaymentMethods = function() {
  const url = this.buildURL('merchantgatewaypaymentmethods');
  return this.get(url);
}

Api.prototype.getCCPaymentMethodId = function() {
  return this.listPaymentMethods()
    .then(methods => methods.find(m => m.PaymentMethods.Name.toLowerCase() === 'credit card'))
    .then(method => m.MerchantGatewayPaymentMethodId)
}


Api.prototype.getOrAddCustomer = function(customer, searchBy) {
  searchBy = searchBy || ['Email'];
  const url = this.buildURL('customers/search')
  const data = _pick(customer, searchBy);
  const qs = {page: 1, size: 1};
  return this.post(url, data, {qs})
    .then(customers => {
      if (customers.length) return new Customer(customers[0]);
      return this.addCustomer(customer);
    });
}

Api.prototype.addCustomer = function(customer) {
  const url = this.buildURL('customers');
  return this.post(url, customer)
    .then(returnedCustomer => new Customer(returnedCustomer));
}

Api.prototype.addInvoice = function(invoice) {
  const url = this.buildURL('invoices');
  return this.post(url, invoice)
    .then(newInvoice => {
      newInvoice.Items = newInvoice.Items.map(i => new InvoiceItem(i));
      return new Invoice(newInvoice);
    });
}

Api.prototype.processTransaction = function(transaction) {
  const url = this.buildURL('transactions');
  return this.post(url, transaction)
    .then(returnedTransaction => new Transaction(returnedTransaction))
}
