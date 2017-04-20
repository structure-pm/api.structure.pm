import {Router} from 'express';
import * as repairs from './controllers/repairs.controller';


export default function(config) {
  let router = Router();

  router.post('/repairs/search', repairs.search);
  router.get('/repairs/repairTypes', repairs.repairTypes);
  router.get('/repairs/zones', repairs.listZones);
  router.get('/repairs/staff', repairs.listStaff);

  router.get('/repairs/:repairId/entries', repairs.entriesForRepair)
  router.post('/repairs/:repairId/entries', repairs.createRepairEntry)

  return router;
}
