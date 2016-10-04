import * as db from '../../db';
import createLocationRepository from '../assets/location.repository';
import createUnitRepository from '../assets/unit.repository';


const Bill = {


  findById(entryID) {
    const eLedgerTable = `${db.getPrefix()}_expenses.eLedger`;
    const query = `
      SELECT *
      FROM ${eLedgerTable}
      WHERE entryID=?`;
    return db.query(query, [entryID])
      .spread((rows, meta) => (rows.length) ? rows[0] : null )
  },


  createBillForUnit(unitID, billData, options) {
    let Units = createUnitRepository();
    Units.findById(unitID).then(unit => {
      if (!unit) return Promise.reject(new Error(`Unit ${unitID} not found`))

      billData = Object.assign({}, billData, {
        managerID : null,
        ownerID   :unit.ownerID,
        locationID: unit.locationID,
        unitID    : unit.unitID,
      });
      return this.create(billData, options);
    })
  },

  createBillForLocation(locationID, billData, options) {
    let Locations = createLocationRepository();
    Locations.findById(locationID).then(location => {
      if (!location) return Promise.reject(new Error(`Location ${locationID} not found`))

      billData = Object.assign({}, billData, {
        managerID : null,
        ownerID   : location.ownerID,
        locationID: location.locationID,
        unitID    : null,
      });
      return this.create(billData, options);
    })
  },

  createBillForOwner(ownerID, billData, options) {
    billData = Object.assign({}, billData, {
      managerID : null,
      ownerID   : ownerID,
      locationID: null,
      unitID    : null,
    });
    return this.create(billData, options);
  },

  createBillForManager(managerID, billData, options) {
    billData = Object.assign({}, billData, {
      managerID : managerID,
      ownerID   : null,
      locationID: null,
      unitID    : null,
    });
    return this.create(billData, options);
  },

  create(billData, options) {
    const eLedgerTable = `${db.getPrefix()}_expenses.eLedger`;
    const insertFields = [
      'managerID',
      'ownerID',
      'locationID',
      'unitID',
      'createDate',
      'dueDate',
      'vendorID',
      'expenseID',
      'amount',
      'comment',
      'payment',
    ];
    const values = insertFields.map(fld => billData[fld]);
    const placeHolders = insertFields.map(fld => '?').join(',');
    const insertQuery = `
      INSERT INTO ${eLedgerTable} (
        ${insertFields.join(',')}
      ) VALUES (
        ${placeHolders}
      )`;
    const selectQuery = `SELECT * FROM ${eLedgerTable} WHERE entryID=?`;
    return db.query(insertQuery, values, options)
      .then(res => {
        if (res.insertId) {
          return db.query(selectQuery, [res.insertId])
        } else {
          return res
        }
      });
  }
};

export default function createBill() {
  let repo = Object.create(Bill);
  return repo;
}
