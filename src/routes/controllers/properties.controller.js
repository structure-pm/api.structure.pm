import _omit from 'lodash/omit';
import _pick from 'lodash/pick';
import OwnerRepo from '../../domain/assets/owner.repository';
import UnitRepo from '../../domain/assets/unit.repository';
import LocationRepo from '../../domain/assets/location.repository';

export function getOwners(req, res, next) {
  const searchFields = ['ownerID', 'managedBy', 'managerID', 'nickname', 'lName', 'fName', 'active'];

  let where = _pick(req.query, searchFields);

  // `managerID` is a convenience field
  if (where.hasOwnProperty('managerID')) {
    where.managedBy = where.managerID;
    delete where.managerID;
  }

  // Unless specified, default to active owners only
  if (!where.hasOwnProperty('active')) where.active = 1;
  OwnerRepo.find(where)
    .then(owners => {
      res.json(owners);
    })
    .catch(next);
}


export function getLocation(req, res, next) {
  const locationSearchFields = ['locationID', 'shortHand', 'ownerID', 'zoneID', 'active'];
  const ownerSearchFields = ['managedBy', 'managerID'];

  let locationWhere = _pick(req.query, locationSearchFields);
  locationWhere = prefixObject('location', locationWhere);

  let ownerWhere = _pick(req.query, ownerSearchFields);
  // `managerID` is a convenience field
  if (ownerWhere.hasOwnProperty('managerID')) {
    ownerWhere['managedBy'] = ownerWhere.managerID;
    delete ownerWhere.managerID;
  }
  ownerWhere = prefixObject('owner', ownerWhere);

  let where = Object.assign({}, locationWhere, ownerWhere);

  // Unless specified, default to active owners only
  if (!where.hasOwnProperty('location.active')) where['location.active'] = 1;
  LocationRepo.find(where)
    .then(locations => {
      res.json(locations);
    })
    .catch(next);
}


export function getUnit(req, res, next) {
  const options = {
    limit: req.query.limit || 50,
    offset: req.query.offset || 0,
    fields: req.query.fields
  }

  const where = _omit(req.query, ['limit', 'offset', 'fields']);
  where.unitID = req.params.unitID || where.unitID;

  UnitRepo.find(where, options)
    .then(units => res.json(units) )
    .catch(next);
}

function prefixObject(prefix, obj) {
  return Object.keys(obj).reduce((prefObj, key) => {
    prefObj[prefix + '.' + key] = obj[key];
    return prefObj;
  }, {})
}
