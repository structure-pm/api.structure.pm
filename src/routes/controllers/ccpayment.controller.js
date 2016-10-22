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
  // paymentService.createCustomer(customer)
  //   .then(customer => {
  //     transaction.CustomerId = customer.CustomerId;
  //     return paymentService.createSaleTransaction(transaction);
  //   })
  //   .then(transaction => res.json(transaction))
  //   .catch(next);
}


export function getMethods(req, res, next) {
  paymentService.getMerchantGatewayPaymentMethods()
    .then(methods => res.json(methods))
    .catch(next);
}
