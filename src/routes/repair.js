import {Router} from 'express';
import * as repairs from './controllers/repairs.controller';


export default function(config) {
  let router = Router();

  router.post('/repairs/search', repairs.search);
  router.get('/repairs/repairTypes', repairs.repairTypes);

  return router;
}
