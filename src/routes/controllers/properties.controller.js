import _ from 'lodash';
import createOwnerRepository from '../../domain/assets/owner.repository';

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
