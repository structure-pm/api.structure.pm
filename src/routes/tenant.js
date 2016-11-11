import {Router} from 'express';
import * as tenant from './controllers/tenant.controller';

export default function(config) {
  let router = Router();
  router.post('/tenant/:tenantID/payments', tenant.receivePayment);

  return router;
}
