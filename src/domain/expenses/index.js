import BillRepo from './bill.repository';
import VendorRepo from './vendor.repository';
import UnitRepo from '../assets/unit.repository';
import LocationRepo from '../assets/location.repository';


const Expenses = {};
export default Expenses;


Expenses.createBill = function(billData, options) {
  BillRepo.create(billData)
    .then(bill => BillRepo.save(bill))
}

Expenses.createBillForUnit = function(unitID, billData, options) {
  return UnitRepo.getById(unitID).then(unit => {
    if (!unit) return Promise.reject(new Error(`Unit ${unitID} not found`))

    billData = Object.assign({}, billData, {
      managerID : null,
      ownerID   : unit.ownerID,
      locationID: unit.locationID,
      unitID    : unit.unitID,
    });
    const bill = BillRepo.create(billData, options);
    return BillRepo.save(bill);
  })
};

Expenses.createBillForLocation = function(locationID, billData, options) {
  return LocationRepo.getById(locationID).then(location => {
    if (!location) return Promise.reject(new Error(`Location ${locationID} not found`))

    billData = Object.assign({}, billData, {
      managerID : null,
      ownerID   : location.ownerID,
      locationID: location.locationID,
      unitID    : null,
    });
    const bill = BillRepo.create(billData, options);
    return BillRepo.save(bill);
  })
};

Expenses.createBillForOwner = function(ownerID, billData, options) {
  billData = Object.assign({}, billData, {
    managerID : null,
    ownerID   : ownerID,
    locationID: null,
    unitID    : null,
  });
  const bill = BillRepo.create(billData, options);
  return BillRepo.save(bill);
};

Expenses.createBillForManager = function(managerID, billData, options) {
  billData = Object.assign({}, billData, {
    managerID : managerID,
    ownerID   : null,
    locationID: null,
    unitID    : null,
  });
  const bill = BillRepo.create(billData, options);
  return BillRepo.save(bill);
}
