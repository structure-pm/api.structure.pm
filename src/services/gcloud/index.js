import gcloud from './gcloud';
import mock from './mock';

const GC = {};
export default GC;

if (process.env.NODE_ENV === 'test') {
  Object.assign(GC, mock);
} else {
  Object.assign(GC, gcloud);
}
