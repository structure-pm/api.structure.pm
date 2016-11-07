import Promise from 'bluebird';
import _pick from 'lodash/pick';
import Lease from './lease';
import * as db from '../../db';

const Repo = {};
export default Repo;

Repo.create = function(data) {
  return new Lease(data);
}

Repo.get = function(id, options) {
  return Repo.find({leaseID: id}, options)
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

Repo.save = function(lease, options) {
  return (lease.id) ? updateLease(lease, options) : insertLease(lease, options);
}

function updateLease(lease, options) {
  if (!lease.id) return Promise.reject(new Error('Cannot update lease with an id'));
  const fields = Lease.Fields.filter(fld => lease[fld] !== undefined);
  const sets = fields.map(fld => `${fld}=${db.escape(lease[fld])}`).join(',');
  const leaseTable = `${db.getPrefix()}_assets.lease`;
  const updateSQL = `UPDATE ${leaseTable} SET ${sets} WHERE leaseID=${lease.id}`;
  return db.query(updateSQL, options)
    .then(() => Repo.get(lease.id));
}

function insertLease(lease, options) {
  if (lease.id) return Promise.reject(new Error('Cannot insert an lease that already has an id'));
  const fields = Lease.Fields.filter(fld => lease[fld] !== undefined);
  const placeholders = fields.map(fld => '?').join(',');
  const values = fields.map(fld => lease[fld]);
  const leaseTable = `${db.getPrefix()}_assets.lease`;
  const insertSQL = `INSERT INTO ${leaseTable} (${fields.join(',')}) VALUES (${placeholders})`;
  return db.query(insertSQL, values, options)
    .then(res => Repo.get(res.insertId));
}
