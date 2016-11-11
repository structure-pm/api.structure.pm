import {Router} from 'express';
import * as owner from './controllers/owner.controller';

export default function(config) {
  let router = Router();
  router.get('/owner/:ownerID/deposits', owner.getDeposits);
  router.post('/owner/:ownerID/deposits', owner.makeDeposit);

  return router;
}
