import multer from 'multer';
import {Router} from 'express';
import * as scan from './controllers/scan.controller';
import gcloud from '../domain/gcloud'

const storage = multer.memoryStorage();
const upload = multer({storage});

export default function(config) {
  let router = Router();
  router.post('/scan', scan.importScan);
  router.get('/scan/unknown', scan.getUnknownAccounts);
  router.post('/scan/unknown/:unknownAccountID', scan.associateUnknownAccount);
  router.delete('/scan/unknown/:unknownAccountID', scan.deleteUnknownAccount);

  router.post('/scan/upload', upload.single('scan'), scan.handleScanUpload);


  return router;
}


function gfilename(req, res, next) {
  const assetType = req.query.assetType,
        assetID = req.query.assetID,
        filename = req.query.filename;

  if (!assetType) return next(new Error('Missing `assetType` from request'));
  if (!assetID) return next(new Error('Missing `assetID` from request'));
  if (!filename) return next(new Error('Missing `filename` from request'));
  if (!req.file) return next(new Error('No file present'));

  req.file.gcloudFilename = `${assetType}/${assetID}/${filename}`;
  next();
}
