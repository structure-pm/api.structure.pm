import * as paymentService from '../../domain/ccpayment';

export function makePayment(req, res, next) {
  const customer = req.body.customer;
  const transaction = req.body.transaction;
  paymentService.createCustomer(customer)
    .then(customer => {
      transaction.CustomerId = customer.CustomerId;
      return paymentService.createSaleTransaction(transaction);
    })
    .then(transaction => res.json(transaction))
    .catch(next);
}


export function getMethods(req, res, next) {
  paymentService.getMerchantGatewayPaymentMethods()
    .then(methods => res.json(methods))
    .catch(next);
}
