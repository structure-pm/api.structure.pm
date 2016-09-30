import request from 'request-promise';
import config from '../../config';

const BASE_URL = config.ccpayment.base_uri;
const DEMO = config.ccpayment.demo;
const StreamPayApi = config.ccpayment.StreamPayApi;
const Origin = config.ccpayment.Origin;
const CreditCardMethodId = config.ccpayment.CreditCardMethodId;

const headers = {
  Accept: 'application/json, text/plain, */*',
  "Content-Type": 'application/json',
  StreamPayApi: StreamPayApi,
  Origin: Origin,
};

const requestOptions = {
  qs: {demo: DEMO},
  headers: headers,
  json: true
}

export function createCustomer(data) {
  const uri = `${BASE_URL}/customers/`;
  return request.post(uri, Object.assign({}, requestOptions, {body: data}));
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
    .then(data => {
      // return data;
      return request.post(uri, Object.assign({}, requestOptions, {body: data}));
    });

}


export function getMerchantGatewayPaymentMethods() {
  const uri = `${BASE_URL}/merchantgatewaypaymentmethods/`;
  return request.get(uri, requestOptions);
}
