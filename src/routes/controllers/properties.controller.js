import _ from 'lodash';
import createOwnerRepository from '../../domain/assets/owner.repository';
import createLocationRepository from '../../domain/assets/location.repository';
import createUnitRepository from '../../domain/assets/unit.repository';

export function getOwners(req, res, next) {
  const Owners = createOwnerRepository();
  const searchFields = ['ownerID', 'managedBy', 'managerID', 'nickname', 'lName', 'fName', 'active'];

  let where = _.pick(req.query, searchFields);

  // `managerID` is a convenience field
  if (where.hasOwnProperty('managerID')) {
    where.managedBy = where.managerID;
    delete where.managerID;
  }

  // Unless specified, default to active owners only
  if (!where.hasOwnProperty('active')) where.active = 1;
  Owners.find(where)
    .then(owners => {
      res.json(owners);
    })
    .catch(next);
}


export function getLocation(req, res, next) {
  const Locations = createLocationRepository();
  const locationSearchFields = ['locationID', 'shortHand', 'ownerID', 'zoneID', 'active'];
  const ownerSearchFields = ['managedBy', 'managerID'];

  let locationWhere = _.pick(req.query, locationSearchFields);
  locationWhere = prefixObject('location', locationWhere);

  let ownerWhere = _.pick(req.query, ownerSearchFields);
  // `managerID` is a convenience field
  if (ownerWhere.hasOwnProperty('managerID')) {
    ownerWhere['managedBy'] = ownerWhere.managerID;
    delete ownerWhere.managerID;
  }
  ownerWhere = prefixObject('owner', ownerWhere);

  let where = Object.assign({}, locationWhere, ownerWhere);

  // Unless specified, default to active owners only
  if (!where.hasOwnProperty('location.active')) where['location.active'] = 1;
  Locations.find(where)
    .then(locations => {
      res.json(locations);
    })
    .catch(next);
}


export function getUnit(req, res, next) {
  const Units = createUnitRepository();
  const unitSearchFields = ['unitID', 'locationID', 'available', 'active'];
  const locationSearchFields = ['ownerID'];
  const ownerSearchFields = ['managerID', 'managedBy'];

  let unitWhere = _.pick(req.query, unitSearchFields);
  unitWhere = prefixObject('unit', unitWhere);

  let locationWhere = _.pick(req.query, locationSearchFields);
  locationWhere = prefixObject('location', locationWhere);

  let ownerWhere = _.pick(req.query, ownerSearchFields);
  // `managerID` is a convenience field
  if (ownerWhere.hasOwnProperty('managerID')) {
    ownerWhere['managedBy'] = ownerWhere.managerID;
    delete ownerWhere.managerID;
  }
  ownerWhere = prefixObject('owner', ownerWhere);

  let where = Object.assign({}, unitWhere, locationWhere, ownerWhere);

  // Unless specified, default to active owners only
  if (!where.hasOwnProperty('unit.active')) where['unit.active'] = 1;
  Units.find(where)
    .then(units => {
      res.json(units);
    })
    .catch(next);
}

function prefixObject(prefix, obj) {
  return Object.keys(obj).reduce((prefObj, key) => {
    prefObj[prefix + '.' + key] = obj[key];
    return prefObj;
  }, {})
}
