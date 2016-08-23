import * as db from '../../db';


const Location = {
  findByOwnerID(ownerID, options) {
    return this.find({'location.ownerID': ownerID}, options)
  },
  findByManagerID(managerID, options) {
    return this.find({'owner.managerID': managerID}, options)
  },
  findById(id, options) {
    return this.find({locationID: id}, options)
      .then(locs => (locs && locs.length) ? locs[0] : null)
  },

  find(where={}, options={}) {
    const locationTable = `${db.getPrefix()}_assets.location`;
    const ownerTable = `${db.getPrefix()}_assets.owner`;
    const whereClauses = Object.keys(where).map(key => `${key}=?`)
    if (!options.includeDNM) {
      whereClauses.push("location.shortHand NOT LIKE '%DNM%'");
    }
    const whereClause = (whereClauses.length) ? 'WHERE ' + whereClauses.join(' AND ') : '';
    const values = Object.keys(where).map(key => where[key]);


    const query = `
      SELECT
        location.*,
        COALESCE(location.shortHand, location.locationID) as locationName,
        owner.managedBy
      FROM ${locationTable}
        LEFT JOIN ${ownerTable}  on owner.ownerID = location.ownerID
      ${whereClause}
      ORDER BY COALESCE(location.shortHand, location.locationID)`;
    return db.query(query, values);

  }
}

export default function createLocation() {
  let repo = Object.create(Location);
  return repo;
}
