import * as db from '../../db';


const Location = {
  findByOwnerID(ownerID, options) {
    return this.find({'location.ownerID': ownerID}, options)
  },
  findByManagerID(managerID, options) {
    return this.find({'owner.managerID': managerID}, options)
  },

  find(ands, options) {
    const locationTable = `${db.getPrefix()}_assets.location`;
    const ownerTable = `${db.getPrefix()}_assets.owner`;
    let where_clause = [];
    let values = [];
    for (key in ands) {
      where_clause.push(`${key}=?`);
      values.push(ands[key]);
    }

    if (!options.includeDNM) {
      where_clause.push("location.shortHand NOT LIKE '%DNM%'")
    }
    where_clause = where_clause.joins(' AND ');

    const query = `
      SELECT
        location.*,
        owner.managedBy
      FROM ${locationTable}
        LEFT JOIN ${ownerTable}  on owner.ownerID = location.ownerID
      WHERE
        ${where_clause}; `;
    return db.query(query, values);

  }
}

export default function createLocation() {
  let repo = Object.create(Location);
  return repo;
}
