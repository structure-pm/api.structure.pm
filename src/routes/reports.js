import {Router} from 'express';
import * as reports from './controllers/reports.controller';

export default function(config) {
  let router = Router();
  router.post('/reports', reports.runReport);

  // TODO:
  router.get('/reports', reports.getReportDefinitions);
  router.get('/reports/dataservice/:dataserviceName', reports.getDataservice);

  return router;
}
