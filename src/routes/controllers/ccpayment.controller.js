import Promise from 'bluebird';
import * as paymentService from '../../domain/ccpayment';

export function makePayment(req, res, next) {
  const customer = req.body.customer;
  const creditCardInfo = req.body.creditCardInfo;
  const rent = (typeof req.body.rent === 'string') ? parseFloat(req.body.rent) : req.body.rent;


  if (!customer.LastName) customer.LastName = "(none)";

  const requiredCustomerFields = ["tenantID", "Email", "FirstName", "LastName", "Phone", "Address"];
  const missingCustomer = requiredCustomerFields.filter(fld => !customer.hasOwnProperty(fld));
  if (missingCustomer.length) {
    return next(new Error(`Missing fields [${missingCustomer.join(',')}] from customer data`));
  }

  paymentService.payRent(customer, rent, creditCardInfo)
    .then(transaction => res.json(transaction))
    .catch(next);

}


export function createTenantCCPayment(req, res, next) {
  const PROCESSING_FEE_INCOME_ID = 67;

  const customer = req.body.customer;
  const creditCardInfo = req.body.creditCardInfo;
  const payment = req.body.payment;

  if (!payment || !Array.isArray(payment) || !payment.length) {
    const err = new Error(`Missing valid 'payment' field, which is a list of line items.`);
    err.status = 400;
    return next(err);
  }


  const requiredCustomerFields = ["Email", "FirstName", "LastName", "Phone", "Address"];
  const missingCustomer = requiredCustomerFields.filter(fld => !customer.hasOwnProperty(fld));
  if (missingCustomer.length) {
    const err = new Error(`Missing fields [${missingCustomer.join(',')}] from customer data`);
    err.status = 400;
    return next(err);
  }

  const paymentsToProcess = payment.filter(p => p.incomeID !== PROCESSING_FEE_INCOME_ID)
  const totalAmount = payment.reduce((sum, p) => sum + p.amount, 0);
  const paymentAmount = paymentsToProcess.reduce((sum, p) => sum + p.amount, 0);
  const ccProcessingFee = totalAmount - paymentAmount;

  paymentService.createTransaction(customer, totalAmount, creditCardInfo)
    // if the transaction was successful, create the payment using the tenant api
    .then(transaction => {
      console.log("transaction", transaction);
      return res.json(transaction);
    })
    .catch(next);

}


export function getMethods(req, res, next) {
  paymentService.getMerchantGatewayPaymentMethods()
    .then(methods => res.json(methods))
    .catch(next);
}
