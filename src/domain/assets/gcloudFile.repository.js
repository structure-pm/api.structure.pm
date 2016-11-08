import * as db from '../../db';
import Promise from 'bluebird';
import GFile from './gfile';

const gcfile = {};
export default gcfile;


gcfile.create = function(fileData) {
  return new GFile(fileData);
}

gcfile.get = function(id, options) {
  return gcfile.find({id: id}, options)
    .then(files => (files && files.length) ? files[0] : null);
}

gcfile.find = function(where, options) {
  const gcfileTable = `${db.getPrefix()}_log.google_cloud_objects`;
  const whereClauses = [];
  if (where.id) whereClauses.push('id=' + db.escape(where.id));
  if (where.assetType) whereClauses.push(`assetType=${db.escape(where.assetType)}`);
  if (where.assetID) whereClauses.push(`assetID=${db.escape(where.assetID)}`);
  const whereClause = (whereClauses.length) ? "WHERE " + whereClauses.join(' AND ') : '';
  const selectQuery = `SELECT * FROM ${gcfileTable} ${whereClause}`;
  return db.query(selectQuery, options)
    .map(row => new GFile(row));
}


gcfile.save = function(file, options) {
  return Promise.resolve( (file.id) ? updateFile(file, options) : insertFile(file, options) );
}

function insertFile(file, options) {
  if (file.id) throw new Error("Cannot insert file with id");

  const gcfileTable = `${db.getPrefix()}_log.google_cloud_objects`;
  const insertFields = ['title', 'filename', 'description', 'mimeType', 'assetType', 'assetID', 'finalized', 'userID', 'createdAt'];
  const insertValues = insertFields.map(fld => file[fld]);
  const placeHolders = insertValues.map(v => '?').join(',');
  const insertSQL = `INSERT INTO ${gcfileTable} (${insertFields.join(',')}) VALUES ( ${placeHolders} )`;
  return db.query(insertSQL, insertValues, options)
    .then(res => gcfile.get(res.insertId, options))
}

function updateFile(file, options) {
  if (!file.id) throw new Error("cannot update a file without an id");

  const id = file.id;
  const fields = ['title', 'filename', 'description', 'mimeType', 'assetType', 'assetID', 'finalized', 'userID', 'createdAt'];
  const updateFields = fields.map(fld => `${fld}=?`);
  const updateValues = fields.map(fld => file[fld]);
  const gcfileTable = `${db.getPrefix()}_log.google_cloud_objects`;

  const updateSQL = `UPDATE ${gcfileTable} SET ${updateFields.join(',')} WHERE id=${id}`;
  return db.query(updateSQL, updateValues, options)
    .then(res => gcfile.get(id, options))
}
