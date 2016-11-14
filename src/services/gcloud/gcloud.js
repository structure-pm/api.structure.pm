import fs from 'fs';
import Promise from 'bluebird';
import {minutesFromNow} from './util';
import config from '../../config';
import GoogleCloud from 'google-cloud';


const GOOGLE_PROJECT_ID = config.gcloud.GOOGLE_PROJECT_ID;
const GOOGLE_KEYFILE = config.gcloud.GOOGLE_KEYFILE;
const GOOGLE_DEFAULT_BUCKET = config.gcloud.GOOGLE_DEFAULT_BUCKET;

const GCloud = GoogleCloud({
  projectId: GOOGLE_PROJECT_ID,
  keyFilename: GOOGLE_KEYFILE
});
const gcs = GCloud.storage();


const gcloud = {};
export default gcloud;

gcloud.listBuckets = function() { return gcs.getBucketsAsync(); }

gcloud.putUrl = function(options) { return signedUrl('write', options); };
gcloud.getUrl = function(options) { return signedUrl('read', options); };

gcloud.deleteFile = function (filename) {
  return new Promise((resolve, reject) => {
    if (!filename) throw new Error("options.filename is a required parameter.");
    const file = gcs.bucket(GOOGLE_DEFAULT_BUCKET).file(filename);

    return file.delete((err, delResponse) => {
      if (err) return reject(err);
      return resolve(delResponse);
    });

  });
}

gcloud.saveFileToCloud = function(gcsname, mimeType, localFilename) {
  return new Promise((resolve, reject) => {
    var file = gcs.bucket(GOOGLE_DEFAULT_BUCKET).file(gcsname);
    fs.createReadStream(localFilename)
      .pipe(file.createWriteStream({
        metadata: { contentType: mimeType }
      }))
      .on('error', reject)
      .on('finish', () => resolve(getPublicUrl(gcsname)));

  })
}

gcloud.saveBufferToCloud = function(gcsname, mimeType, buffer) {
  return new Promise((resolve, reject) => {
    var file = gcs.bucket(GOOGLE_DEFAULT_BUCKET).file(gcsname);

    var stream = file.createWriteStream({
      metadata: { contentType: mimeType }
    });

    stream.on('error', reject);
    stream.on('finish', () => resolve(getPublicUrl(gcsname)));
    stream.end(buffer);
  })
}

gcloud.moveFile = function(filename, newFilename) {
  return new Promise((resolve, reject) => {
    var file = gcs.bucket(GOOGLE_DEFAULT_BUCKET).file(filename);
    file.move(newFilename, (err, destinationFile, apiResponse) => {
      if (err) return reject(err);
      return resolve(newFilename);
    });
  });
}

function getPublicUrl(filename) {
  return `https://storage.googleapis.com/${GOOGLE_DEFAULT_BUCKET}/${filename}`;
}

function signedUrl(action, options={}) {
  return new Promise((resolve, reject) => {
    if (!options.filename) throw new Error("options.filename is a required parameter.");
    const filename = options.filename;

    const bucket = gcs.bucket(GOOGLE_DEFAULT_BUCKET);
    const file = bucket.file(filename);
    const expires = minutesFromNow(options.expiresInMinutes || 10);


    let urlOptions = {
      action: action,
      expires: '03-17-2025',
    };
    if (options.contentType) {
      urlOptions.contentType = options.contentType
    }

    if (action === 'read') {
      let saveAsFilename = filename.split('/');
      saveAsFilename = saveAsFilename[saveAsFilename.length -1];
      urlOptions.responseDisposition = `attachment; filename="${saveAsFilename}"`;
    }

    return file.getSignedUrl(urlOptions, (err, url) => {
      if (err) return reject(err);
      return resolve(url);
    });
  })
}
