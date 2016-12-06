import {Router} from 'express';
import * as reports from './controllers/reports.controller';

export default function(config) {
  let router = Router();
  router.post('/reports', reports.renderReport);

  // TODO:
  // router.get('/reports', reports.getReportsList);
  router.get('/reports/dataservice/:dataserviceName', reports.getDataservice);

  return router;
}
