import {Router} from 'express';
import * as properties from './controllers/properties.controller';

export default function(config) {
  let router = Router();
  router.get('/owner', properties.getOwners);
  router.get('/location', properties.getLocation);
  router.get('/unit', properties.getUnit);

  router.get('/units', properties.getUnit);
  router.get('/units/:unitID', properties.getUnit);

  router.get('/test', function(req, res, next) {
    console.log(req.query.q);
    return res.json('ok')
  })

  return router;
}
