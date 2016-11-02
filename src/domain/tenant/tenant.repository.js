import Promise from 'bluebird';
import _pick from 'lodash/pick';
import Tenant from './tenant';
import * as db from '../../db';

const Repo = {};
export default Repo;

Repo.get = function(id, options) {
  return repo.find({tenantID: id}, options)
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
