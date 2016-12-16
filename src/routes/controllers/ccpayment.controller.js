import Moment from 'moment';
import Promise from 'bluebird';
import * as paymentService from '../../domain/ccpayment';
import LeaseRepo from '../../domain/tenant/lease.repository';
import Tenant from '../../domain/tenant';

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

  const requiredBodyFields = ['customer', 'creditCardInfo', 'payment', 'tenantID', 'leaseID'];
  const missingBody = requiredBodyFields.filter(fld => !req.body.hasOwnProperty(fld));
  if (missingBody.length) {
    const err = new Error(`Missing fields [${missingBody.join(',')}] from POST body`);
    err.status = 400;
    return next(err);
  }

  const customer       = req.body.customer;
  const creditCardInfo = req.body.creditCardInfo;
  const payment        = req.body.payment;
  const tenantID       = req.body.tenantID;
  const leaseID        = req.body.leaseID;

  if (!Array.isArray(payment) || !payment.length) {
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
      if (!transaction.Approved) {
        const resp = transactionResponse(false, true, null, transaction.GatewayResponse);
        return res.json( resp );
      }

      const comment = `Paid via credit card; Trans ID=${transaction.TransactionId}`;
      const dateNow = Moment().format('YYYY-MM-DD');
      const lines = paymentsToProcess.map(p => ({
        dateStamp: dateNow,
        amount: p.amount,
        incomeID: p.incomeID,
        comment: comment
      }));

      const paymentData = {
        paymentDate: dateNow,
        leaseID: leaseID,
        tenantID: tenantID,
        lines: lines,
        comment: comment
      }


      return LeaseRepo.get(leaseID)
        .then(lease => Tenant.receivePayment(lease, paymentData))
        .then(payRes => {
          const resp = transactionResponse(true, false, transaction.TransactionId, transaction.GatewayResponse);
          return res.json( resp );
        })
        .catch(err => {
          console.log(err);
          console.log(err.stack);
          const resp = transactionResponse(true, err, transaction.TransactionId, "The credit card transaction was successful, but there was an error on the server.  Please contact a leasing agent.");
          return res.json( resp );
        })
    })
    .catch(next);

}


function transactionResponse(approved, error, txId, message) {

  return {
    approved: approved,
    error: (error && error.message) ? error.message : error,
    transactionId: txId,
    message: message
  };
}


export function getMethods(req, res, next) {
  paymentService.getMerchantGatewayPaymentMethods()
    .then(methods => res.json(methods))
    .catch(next);
}
