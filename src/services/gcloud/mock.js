import Promise from 'bluebird';
import config from '../../config';

const GOOGLE_DEFAULT_BUCKET = config.gcloud.GOOGLE_DEFAULT_BUCKET;


const mock = {};
export default mock;

mock.isMock = true;
mock.moveFileLog = [];
mock.saveFileLog = [];

mock.listBuckets = function() {
  return Promise.resolve([GOOGLE_DEFAULT_BUCKET]);
}

mock.putUrl = function(options) {
  return Promise.resolve("http://www.google.com");
}

mock.getUrl = function(options) {
  return Promise.resolve("http://www.google.com");
}

mock.deleteFile = function(filename) {
  return Promise.resolve({deleted: filename});
}

mock.saveBufferToCloud = function(cloudFilename, mimeType, buffer) {
  mock.saveFileLog.push({cloudFilename, mimeType, buffer});
  return Promise.resolve(cloudFilename);
}

mock.moveFile = function(filename, newFilename) {
  mock.moveFileLog.push({filename, newFilename});
  return Promise.resolve(newFilename);
}
