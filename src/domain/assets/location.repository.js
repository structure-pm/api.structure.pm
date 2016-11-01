import * as db from '../../db';

const LocationRepo = {};
export default LocationRepo;

LocationRepo.findByOwnerID = function(ownerID, options) {
  return this.find({'location.ownerID': ownerID}, options)
}

LocationRepo.findByManagerID = function(managerID, options) {
  return this.find({'owner.managerID': managerID}, options)
}

LocationRepo.findById = function(id, options) {
  return this.find({locationID: id}, options)
    .then(locs => (locs && locs.length) ? locs[0] : null)
}
LocationRepo.getById = LocationRepo.findById;

LocationRepo.find = function(where={}, options={}) {
  const locationTable = `${db.getPrefix()}_assets.location`;
  const ownerTable = `${db.getPrefix()}_assets.owner`;
  const whereClauses = Object.keys(where).map(key => `${key}=?`)
  if (!options.includeDNM) {
    whereClauses.push("(location.shortHand IS NULL OR location.shortHand NOT LIKE '%DNM%')");
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
