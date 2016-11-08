import {Router} from 'express';
import * as file from './controllers/file.controller';


export default function(config) {
  let router = Router();
  router.get('/files/asset/:assetType/:assetID', file.getFilesForAsset);
  router.post('/files/search', file.searchFiles);


  return router;
}
