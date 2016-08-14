import {Router} from 'express';
import * as properties from './controllers/properties.controller';

export default function(config) {
  let router = Router();
  router.get('/owner', properties.getOwners);

  return router;
}
