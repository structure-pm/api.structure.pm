import Promise from 'bluebird';
import _pick from 'lodash/pick';
import Lease from './lease';
import * as db from '../../db';

const Repo = {};
export default Repo;

Repo.get = function(id, options) {
  return repo.find({leaseID: id}, options)
    .then(leases => (leases && leases.length) ? leases[0] : null);
}

Repo.find = function(where, options) {

  return Promise.resolve()
    .then(() => {
      where = _pick(where || {}, Lease.Fields);
      const leaseTable = `${db.getPrefix()}_assets.lease`;

      if (!Object.keys(where).length) {
        throw new Error("No filters sent to query");
      }

      const whereClause = Object.keys(where).map(key => `${key}=?`).join(' AND ');
      const values = Object.keys(where).map(key => where[key]);

      const selectSQL = `SELECT
        lse.*
        FROM ${leaseTable} lse
        WHERE ${whereClause}`
      return db.query(selectSQL, values, options);
    })
    .map(row => new Lease(row));
}
