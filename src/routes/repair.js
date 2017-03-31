import {Router} from 'express';
import * as repairs from './controllers/repairs.controller';


export default function(config) {
  let router = Router();

  router.get('/repairs', repairs.search);

  return router;
}
