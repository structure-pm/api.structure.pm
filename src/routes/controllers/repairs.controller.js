import moment from 'moment';
import _pick from 'lodash/pick';
import {ReadRepair} from '../../domain/repairs';

exports.search = function(req, res, next) {
  const query = _pick((req.body.filter || {}), [
    'accountID', 'managerID', 'includeComplete',
    'startDate', 'endDate', 'repairType', 'priority',
    'zoneID', 'active', 'search', 'billed'
  ]);
  const options = _pick(req.body.options, ['limit', 'offset', 'sortDir']);

  if (!query.accountID && !query.managerID) {
    const err = new Error('Searcing repairs requires that either an accountID, or managerID be passed as a query parameter.')
    err.status = 400;
    return next(err);
  }

  if (query.startDate) {
    if (!moment(query.startDate).isValid) {
      const err = new Error(`Invalid startDate paramter: ${query.startDate}`);
      err.status = 400;
      return next(err);
    }

    query.startDate = moment(query.startDate).format('YYYY-MM-DD');
  }

  if (query.endDate) {
    if (!moment(query.endDate).isValid) {
      const err = new Error(`Invalid endDate paramter: ${query.endDate}`);
      err.status = 400;
      return next(err);
    }

    query.endDate = moment(query.endDate).format('YYYY-MM-DD');
  }

  options.sortDir = (options.sortDir || 'DESC').toUpperCase();
  if (['ASC', 'DESC'].indexOf(options.sortDir) === -1) options.sortDir = 'DESC'

  ReadRepair.search(query, options)
    .then(repairs => res.json(repairs))
    .catch(next);

}

exports.repairTypes = function(req, res, next) {
  ReadRepair.getRepairTypes()
    .then(repairTypes => res.json(repairTypes))
    .catch(next);
}

exports.listZones = function(req, res, next) {
  const {managerID} = req.query;

  if (!managerID) {
    return res.json([]);
  }

  ReadRepair.getMaintenanceZones(managerID)
    .then(zones => res.json(zones))
    .catch(next);
}
