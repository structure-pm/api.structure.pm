import * as db from '../../db';
import Owner from './owner';

const Repo = {};
export default Repo;

Repo.create = function(data) {
  return new Owner(data);
}

Repo.get = function(id) {
  return Repo.find({ownerID: id})
    .then(owners => (owners && owners.length) ? owners[0] : null);
}

Repo.find = function(where={}, options={}) {
  const ownerTable = `${db.getPrefix()}_assets.owner`;
  const whereClauses = Object.keys(where)
    .map(key => `${key}=?`)
    .concat("(o.nickname NOT LIKE '%DNM%' OR o.nickname is null)");
  const values = Object.keys(where).map(key => where[key]);
  const whereClause = (whereClauses.length) ? 'WHERE ' + whereClauses.join(' AND ') : '';


  const query = `
    SELECT
      *,
      COALESCE(o.nickname, o.lName, o.ownerID) as ownerName
    FROM ${ownerTable} o
    ${whereClause}
    ORDER BY COALESCE(o.nickname, o.lName, o.ownerID)`;
  return db.query(query, values)
    .map(row => new Owner(row));
}

Repo.save = function(owner, options) {
  const ownerTable = `${db.getPrefix()}_assets.owner`;
  db.query(`SELECT ownerID from ${ownerTable} WHERE ownerID='${owner.id}'`)
    .then(rows => (rows.length) ? updateOwner(owner, options) : insertOwner(owner, options) );
}

function updateOwner(owner, options) {
  const fields = Owner.Fields.filter(fld => owner[fld] !== undefined);
  const sets = fields.map(fld => `${fld}=${db.escape(owner[fld])}`).join(',');
  const ownerTable = `${db.getPrefix()}_assets.owner`;
  const updateSQL = `UPDATE ${ownerTable} SET ${sets} WHERE ownerID='${owner.id}'`;
  return db.query(updateSQL, options)
    .then(() => Repo.get(owner.id));
}

function insertOwner(owner, options) {
  const fields = Owner.Fields.filter(fld => owner[fld] !== undefined);
  const placeholders = fields.map(fld => '?').join(',');
  const values = fields.map(fld => owner[fld]);
  const ownerTable = `${db.getPrefix()}_assets.owner`;
  const insertSQL = `INSERT INTO ${ownerTable} (${fields.join(',')}) VALUES (${placeholders})`;
  return db.query(insertSQL, values, options)
    .then(res => Repo.get(res.insertId));
}
