import {Router} from 'express';
import * as tenant from './controllers/tenant.controller';

export default function(config) {
  let router = Router();

  router.get('/tenant/:tenantID', tenant.getTenantProfile);

  router.post('/tenant/:tenantID/payments', tenant.receivePayment);
  router.delete('/tenant/:tenantID/payments/:paymentId', tenant.deletePayment);
  router.post('/tenant/:tenantID/fees', tenant.addFee);
  router.post('/tenant/:tenantID/adjustments', tenant.addAdjustment);
  router.get('/tenant/:tenantID/balance', tenant.getBalance);

  return router;
}
