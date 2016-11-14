import multer from 'multer';
import {Router} from 'express';
import * as file from './controllers/file.controller';

const storage = multer.memoryStorage();
const upload = multer({storage});


export default function(config) {
  let router = Router();
  router.get('/files/asset/:assetType/:assetID', file.getFilesForAsset);
  router.post('/files/search', file.searchFiles);

  const fileFields = upload.fields([
    { name: 'upload', maxCount: 1 },
  ])
  router.post('/scan/upload', fileFields, scan.handleScanUpload);


  return router;
}
