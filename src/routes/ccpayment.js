import {Router} from 'express';
import * as cc from './controllers/ccpayment.controller';

export default function(config) {
  let router = Router();
  router.post('/ccpayment', cc.makePayment);
  router.get('/ccpayment/methods', cc.getMethods);

  return router;
}
