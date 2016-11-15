import {Router} from 'express';
import * as tenant from './controllers/tenant.controller';

export default function(config) {
  let router = Router();
  router.post('/tenant/:tenantID/payments', tenant.receivePayment);
  router.post('/tenant/:tenantID/fees', tenant.addFee);
  router.post('/tenant/:tenantID/credits', tenant.addCredit);

  return router;
}
