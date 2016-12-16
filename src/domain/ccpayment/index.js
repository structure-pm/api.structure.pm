import Promise from 'bluebird';
import request from 'request-promise';
import config from '../../config';
import creditCardType from 'credit-card-type';
import winston from 'winston';
import StreamPayApi, {Customer, Address, Invoice, Transaction, CreditCardInfo} from './streamPay'
import {isValidEmail} from './utils';

const api = new StreamPayApi(config.ccpayment);


const logFile = config.ccpayment.logFile;
const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.File)({ filename: logFile })
  ]
});




export function createTransaction(customerData, amount, ccInfo) {

  return Promise.all([
    api.addCustomer(new Customer(customerData)),
    new CreditCardInfo(ccInfo),
    api.getCCPaymentMethodId()
  ])
    .then(([customer, creditCardInfo, ccPaymentMethodId]) => {
      const transactionOptions = {
        Amount: amount,
        CreditCardInfo: creditCardInfo,
        CustomerId: customer.CustomerId,
        MerchantGatewayPaymentMethodId: ccPaymentMethodId,
        TransactionTypeName: 'sale',
      };
      const transaction = new Transaction(transactionOptions);

      return api.processTransaction(transaction)
        .then(transaction => {
          // Do something to log failed transactions or check process
          logger.info(`Sale - ${customer.FirstName} ${customer.LastName} - ${transaction.Amount} - tid:${transaction.TransactionId}`)
          return transaction;
        })
        .catch(err => {
          logger.error(`[ERROR CustomerID: ${customer.CustomerId}] (${err.ErrorCode}) ${err.message}`);
          throw(err);
        });

    })

}

export function payRent(tenantInfo, rent, ccInfo) {

  if (!isValidEmail(tenantInfo.Email)) {
    tenantInfo.Email = `tenantID-${tenantInfo.tenantID}`;
  }

  const tenant = new Customer(tenantInfo);
  const creditCardInfo = new CreditCardInfo(ccInfo);

  return api.getCCPaymentMethodId()
    .then(method => {
      return Promise.all([
        api.addCustomer(tenant),
        method,
        calculateOnlinePaymentFee(tenant, rent),
      ])
    })
    .spread((tenant, ccPaymentMethodId, onlineFee) => {
      const Amount = rent + onlineFee;
      const transactionOptions = {
        Amount: Amount,
        CreditCardInfo: creditCardInfo,
        CustomerId: tenant.CustomerId,
        MerchantGatewayPaymentMethodId: ccPaymentMethodId,
        TransactionTypeName: 'sale',
      };
      const transaction = new Transaction(transactionOptions);
      return api.processTransaction(transaction)
        .then(transaction => Object.assign(transaction, {rent, onlineFee}))
    })
    .then(transaction => {
      // Do something to log failed transactions or check process
      return transaction;
    })
    .catch(err => {
      logger.error(`[ERROR CustomerID: ${tenant.CustomerId}] (${err.ErrorCode}) ${err.message}`);
      throw(err);
    });

}

export function calculateOnlinePaymentFee(tenant, rent) {
  return 20;
}

export function createRentInvoice(tenant, rent, onlineFee) {
  const invDate = new Date();
  const invoiceNumber = tenant.tenantID + "-" + invDate.getFullYear() + (invDate.getMonth() + 1) + invDate.getUTCDate();
  return new Invoice({
    BillingAddress: tenant.Address,
    CustomerId: tenant.customerId,
    InvoiceNumber: invoiceNumber,
    Items: [
      new InvoiceItem.createSimple('Monthly Rent', 'rent', rent),
      new InvoiceItem.createSimple('Convenience Fee', 'onlineFee', onlineFee)
    ]
  })
}

// -----------------------------------------



function getCCType(CCNumber) {
  const ccType = creditCardType(ccInfo.CreditCardNumber || '');
  return ccType[0].niceType;
}

function addCCType(transaction) {
  let ccInfo = transaction.CreditCardInfo;
  if (!ccInfo || ccInfo.creditCardType) return transaction;

  const ccType = creditCardType(ccInfo.CreditCardNumber || '');
  ccInfo.CreditCardType = ccType[0].niceType;
  return Object.assign({}, transaction, {CreditCardInfo: ccInfo});
}

export function createCustomer(data) {
  const uri = `${BASE_URL}/customers/`;
  return request.post(
    uri,
    Object.assign({}, requestOptions, {body: data})
  )
    .catch(formatErrorResponse);
}

export function createSaleTransaction(data) {
  const uri = `${BASE_URL}/transactions/`;
  const requiredFields = ['Amount', 'CreditCardInfo', 'CustomerId', 'TransactionTypeName'];

  return Promise.resolve(data)
    .then(data => {
      data.TransactionTypeName = 'sale';
      data.MerchantGatewayPaymentMethodId = CreditCardMethodId;

      const missingFields = requiredFields.reduce((missing, field) => {
        if (!data.hasOwnProperty(field)) {
          missing.push(field);
        }
        return missing;
      }, []);

      if (missingFields.length) throw new Error(`Missing fields for sale: [${missingFields.join(', ')}]`);

      return data;
    })
    .then(addCCType)
    .then(data => {
      // return data;
      return request.post(uri, Object.assign({}, requestOptions, {body: data}));
    })
    .catch(formatErrorResponse)
    .catch(err => {
      logger.error(`[ERROR CustomerID: ${data.CustomerId}] (${err.ErrorCode}) ${err.message}`);
      throw(err);
    });

}


export function getMerchantGatewayPaymentMethods() {
  const uri = `${BASE_URL}/merchantgatewaypaymentmethods/`;
  return request.get(uri, requestOptions).catch(formatErrorResponse);
}
