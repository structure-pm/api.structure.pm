import {Router} from 'express';
import * as cc from './controllers/ccpayment.controller';

export default function(config) {
  let router = Router();
  router.get('/ccpayment', function(req,res, next) {
    res.json({
      service: 'ccpayment',
      env: process.env.NODE_ENV,
      demo: config.ccpayment.demo,
      msg: 'pong'
    });
  });
  router.post('/ccpayment', cc.makePayment);
  router.post('/ccpayment/tenant/:tenantID', cc.createTenantCCPayment);
  router.get('/ccpayment/methods', cc.getMethods);

  return router;
}
