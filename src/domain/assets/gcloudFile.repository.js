import * as db from '../../db';


const gcfile = {};
export default gcfile;

gcfile.get = function(id) {
  return gcfile.find({id: id})
    .then(files => (files && files.length) ? files[0] : null);
}

gcfile.find = function(where) {
  const gcfileTable = `${db.getPrefix()}_log.google_cloud_objects`;
  const whereClauses = [];
  if (where.id) whereClauses.push('id=' + db.escape(where.id));
  if (where.assetType) whereClauses.push(`assetType='${db.escape(where.assetType)}'`);
  if (where.assetID) whereClauses.push(`assetID='${db.escape(where.assetID)}'`);
  const whereClause = (whereClauses.length) ? "WHERE " + whereClauses.join(' AND ') : '';
  const selectQuery = `SELECT * FROM ${gcfileTable} ${whereClause}`;
  return db.query(selectQuery)
}

gcfile.create = function(options) {
  return {
    title: options.filename,
    filename: options.filename,
    description: options.description,
    mimeType: options.mimeType,
    assetType: options.assetType,
    assetID: options.assetID,
    finalized: true,
    userID: options.userID,
    createdAt: new Date(),
  }
}

gcfile.save = function(file) {
  const id = file.id;
  const gcfileTable = `${db.getPrefix()}_log.google_cloud_objects`;
  const insertFields = ['title', 'filename', 'description', 'mimeType', 'assetType', 'assetID', 'finalized', 'userID', 'createdAt'];
  const insertValues = insertFields.map(fld => file[fld]);
  const updateFields = insertFields.map(fld => `${fld}=?`);
  const updateValues = insertFields.map(fld => (fld === 'finalized' || fld === 'userID') ? file[fld] : `'${file[fld]}'`);
  const placeHolders = insertValues.map(v => '?').join(',');

  const insertSQL = `INSERT INTO ${gcfileTable} (
    ${insertFields.join(',')}
  ) VALUES (
    ${placeHolders}
  )`;
  const updateSQL = `UPDATE ${gcfileTable} SET ${updateFields.join(',')} WHERE id=${id}`;
  const selectQuery = `SELECT * FROM ${gcfileTable} where id = ? `;

  const query = (!!id) ? updateSQL : insertSQL;
  const values = (!!id) ? updateValues : insertValues;
  return db.query(query, values)
    .then(res => db.query(selectQuery, [res.insertId]))
    .then(rows => (rows && rows.length) ? rows[0] : null);


}
