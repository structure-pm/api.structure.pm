import {Router} from 'express';
import * as scan from './controllers/scan.controller';

export default function(config) {
  let router = Router();
  router.post('/scan', scan.importScan);
  router.get('/scan/unknown', scan.getUnknownAccounts);
  router.post('/scan/unknown/:unknownAccountID', scan.associateUnknownAccount);
  router.delete('/scan/unknown/:unknownAccountID', scan.deleteUnknownAccount);


  return router;
}
