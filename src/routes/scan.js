import {Router} from 'express';
import * as scan from './controllers/scan.controller';

export default function(config) {
  let router = Router();
  router.post('/scan', scan.importScan);
  router.get('/scan/unknown', scan.getUnknownAccounts);

  return router;
}
