import _pick from 'lodash/pick';

const ID_FIELD = 'id';
const FIELDS = [
  ID_FIELD,
  'title', 'filename', 'description', 'mimeType', 'assetType',
  'assetID', 'finalized', 'userID',
]



export default function GFile(data) {
  data = Object.assign({
    createdAt: new Date,
    finalized: true
  }, data);
  data = _pick(data, FIELDS);

  Object.assign(this, data);
  if (!this.title) this.title = this.filename;
}

GFile.prototype.getAssetFilename = function() {
  return `${this.assetType}/${this.assetID}/${this.filename}`;
}
