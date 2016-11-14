import {Router} from 'express';
import * as accounting from './controllers/accounting.controller';

export default function(config) {
  let router = Router();


  // ==== DEPOSITS =============================================================
  router.get('/accounting/deposits', accounting.getDeposits);
  router.post('/accounting/deposits', accounting.makeDeposit);
  router.patch('/accounting/deposits/:depositId', accounting.updateDeposit);



  return router;
}
