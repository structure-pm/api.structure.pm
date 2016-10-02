import request from 'request-promise';
import config from '../../config';
import creditCardType from 'credit-card-type';

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

function formatErrorResponse(errResponse, response, body) {
  if (!errResponse.error || !errResponse.error.Reason) throw errResponse;

  const message = `${errResponse.error.Reason} - ${errResponse.error.Detail}`;
  const errCode = errResponse.error.ErrorCode;
  const err = new Error(message);
  err.status = errResponse.statusCode;
  err.ErrorCode = errCode;
  throw err;
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
    .catch(formatErrorResponse);

}


export function getMerchantGatewayPaymentMethods() {
  const uri = `${BASE_URL}/merchantgatewaypaymentmethods/`;
  return request.get(uri, requestOptions).catch(formatErrorResponse);
}
