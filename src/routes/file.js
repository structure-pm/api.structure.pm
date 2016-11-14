import multer from 'multer';
import {Router} from 'express';
import * as file from './controllers/file.controller';

// TODO: USE File storage so that we aren't risking filling up RAM
// This means we need an Assets.saveFiletoGFile method
// const storage = multer.memoryStorage();
// const storage = multer.disc();

// const upload = multer({storage});
const upload = multer({dest: 'uploads/'});


export default function(config) {
  let router = Router();
  router.get('/files/asset/:assetType/:assetID', file.getFilesForAsset);
  router.post('/files/search', file.searchFiles);

  // const fileFields = upload.fields([
  //   { name: 'upload', maxCount: 1 },
  // ])
  router.post('/files', upload.any(), file.handleUpload);


  return router;
}
