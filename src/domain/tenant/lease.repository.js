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
      const unitTable = `${db.getPrefix()}_assets.unit`;
      const locationTable = `${db.getPrefix()}_assets.location`;

      if (!Object.keys(where).length) {
        throw new Error("No filters sent to query");
      }

      // update the where object so that keys have the proper prefixes
      where = Object.keys(where).reduce((newWhere, key) => {
        let prefix;
        if (key === 'locationID') prefix = 'loc';
        else if (key === 'ownerID') prefix = 'loc';
        else prefix = 'lse';
        const newKey = `${prefix}.${key}`;
        return Object.assign(newWhere, {[newKey]: where[key]});
      }, {});

      const whereClause = Object.keys(where).map(key => `${key}=?`).join(' AND ');
      const values = Object.keys(where).map(key => where[key]);


      const selectSQL = `SELECT
        lse.*,
        loc.locationID,
        loc.ownerID
        FROM ${leaseTable} lse
          LEFT JOIN ${unitTable} u on u.unitID = lse.unitID
          LEFT JOIN ${locationTable} loc on loc.locationID = u.locationID
        WHERE ${whereClause}`
      return db.query(selectSQL, values, options);
    })
    .map(row => new Lease(row));
}
