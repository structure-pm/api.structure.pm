import Promise from 'bluebird';
import _pick from 'lodash/pick';
import Tenant from './tenant';
import * as db from '../../db';

const Repo = {};
export default Repo;

Repo.create = function(data) {
  return new Tenant(data);
}

Repo.get = function(id, options) {
  return Repo.find({tenantID: id}, options)
    .then(tenants => (tenants && tenants.length) ? tenants[0] : null);
}

Repo.find = function(where, options) {

  return Promise.resolve()
    .then(() => {
      where = _pick(where || {}, Tenant.Fields);
      const tenantTable = `${db.getPrefix()}_assets.tenant`;

      if (!Object.keys(where).length) {
        throw new Error("No filters sent to query");
      }

      const whereClause = Object.keys(where).map(key => `${key}=?`).join(' AND ');
      const values = Object.keys(where).map(key => where[key]);

      const selectSQL = `SELECT
        t.*
        FROM ${tenantTable} t
        WHERE ${whereClause}`
      return db.query(selectSQL, values, options);
    })
    .map(row => new Tenant(row));
}

Repo.save = function(tenant, options) {
  return (tenant.id) ? updateTenant(tenant, options) : insertTenant(tenant, options);
}

function updateTenant(tenant, options) {
  if (!tenant.id) return Promise.reject(new Error('Cannot update tenant with an id'));
  const fields = Tenant.Fields.filter(fld => tenant[fld] !== undefined);
  const sets = fields.map(fld => `${fld}=${db.escape(tenant[fld])}`).join(',');
  const tenantTable = `${db.getPrefix()}_assets.tenant`;
  const updateSQL = `UPDATE ${tenantTable} SET ${sets} WHERE tenantID=${tenant.id}`;
  return db.query(updateSQL, options)
    .then(() => Repo.get(tenant.id));
}

function insertTenant(tenant, options) {
  if (tenant.id) return Promise.reject(new Error('Cannot insert an tenant that already has an id'));
  const fields = Tenant.Fields.filter(fld => tenant[fld] !== undefined);
  const placeholders = fields.map(fld => '?').join(',');
  const values = fields.map(fld => tenant[fld]);
  const tenantTable = `${db.getPrefix()}_assets.tenant`;
  const insertSQL = `INSERT INTO ${tenantTable} (${fields.join(',')}) VALUES (${placeholders})`;
  return db.query(insertSQL, values, options)
    .then(res => Repo.get(res.insertId));
}
