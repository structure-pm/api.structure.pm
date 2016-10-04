import {Router} from 'express';
import * as reports from './controllers/reports.controller';

export default function(config) {
  let router = Router();
  router.post('/reports', reports.renderReport);

  return router;
}
