import * as db from '../../db';



const Unit = {
  findById(id, options = {}) {
    return this.find({unitID: id}, options)
      .then(units => (units && units.length) ? units[0] : null);
  },

  find(where={}, options={}) {
    const unitTable = `${db.getPrefix()}_assets.unit`;
    const locationTable = `${db.getPrefix()}_assets.location`;
    const ownerTable = `${db.getPrefix()}_assets.owner`;

    // Unless specified, default to active units only
    where.active = (where.hasOwnProperty('active')) ? where.active : 1;

    // Construct the where clause
    const whereClauses = [];
    if (where.unitID) whereClauses.push(`unit.unitID=${db.escape(where.unitID)}`);
    if (where.locationID) whereClauses.push(`unit.locationID='${db.escape(where.locationID)}'`);
    if (where.ownerID) whereClauses.push(`location.ownerID='${db.escape(where.ownerID)}'`);
    if (where.zoneID) whereClauses.push(`location.zoneID=${db.escape(where.zoneID)}`);
    if (!options.includeDNM) {
      whereClauses.push("location.shortHand NOT LIKE '%DNM%'");
    }

    const offset = options.offset || 0;
    const limit = options.limit || 50;

    const whereClause = (whereClauses.length) ? 'WHERE ' + whereClauses.join(' AND ') : '';
    const limitClause = `LIMIT ${offset}, ${limit}`

    const query = `
      SELECT
        unit.unitID,
        unit.locationID,
        unit.streetNum,
        unit.suiteNum,
        COALESCE(unit.suiteNum, unit.streetNum) as unitName,
        COALESCE(unit.beds, location.beds) as beds,
        COALESCE(unit.baths, location.baths) as baths,
        COALESCE(unit.halfBaths, location.halfBaths) as halfBaths,
        COALESCE(unit.rent, location.rent) as rent,
        COALESCE(unit.deposit, location.deposit) as deposit,
        COALESCE(unit.petRent, location.petRent) as petRent,
        COALESCE(unit.petDeposit, location.petDeposit) as petDeposit,
        unit.sqft,
        unit.unitDesc,
        unit.available,
        unit.availableWhen,
        unit.priority,
        unit.heat,
        unit.gas,
        unit.electricity,
        unit.water,
        unit.trash,
        unit.disabledAccess,
        unit.basement,
        unit.deck,
        unit.patio,
        unit.fireplace,
        unit.centralAir,
        unit.petsAllowed,
        unit.cableReady,
        unit.cableIncluded,
        unit.internetAccess,
        unit.onSiteParking,
        unit.streetParking,
        unit.lawnCare,
        unit.alarmSystem,
        unit.laundry,
        unit.laundryHookups,
        unit.laundromat,
        unit.garage,
        unit.carport,
        unit.furnished,
        unit.pool,
        unit.hotTub,
        unit.tennisCourt,
        unit.dishwasher,
        unit.comment,
        unit.active,
        location.ownerID,
        location.streetNum,
        location.street,
        location.city,
        location.state,
        location.zip,
        location.zoneID
      FROM ${unitTable}
        LEFT JOIN ${locationTable} on location.locationID = unit.locationID
        LEFT JOIN ${ownerTable}  on owner.ownerID = location.ownerID
      ${whereClause}
      ORDER BY COALESCE(unit.suiteNum, unit.streetNum)
      ${limitClause}; `;
    return db.query(query);
  }
}

export default function createUnitRepository() {
  let repo = Object.create(Unit);
  return repo;
}
