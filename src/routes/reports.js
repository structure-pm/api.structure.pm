import {Router} from 'express';
import * as scan from './controllers/report.controller';

export default function(config) {
  let router = Router();
  router.post('/report', report.renderReport);

  return router;
}
