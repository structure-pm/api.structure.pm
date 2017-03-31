import moment from 'moment';
import _pick from 'lodash/pick';
import {ReadRepair} from '../../domain/repairs';

exports.search = function(req, res, next) {
  const query = _pick(req.query, [
    'accountID', 'managerID', 'includeComplete',
    'startDate', 'endDate', 'repairType', 'priority',
    'zoneID',
  ]);
  const options = _pick(req.query, ['limit', 'offset', 'sortDir']);


  if (!query.accountID && !query.managerID) {
    const err = new Error('Searcing repairs requires that either an accountID, or managerID be passed as a query parameter.')
    return next(err);
  }

  if (query.startDate) {
    if (!moment(query.startDate).isValid) {
      const err = new Error(`Invalid startDate paramter: ${query.startDate}`);
      return next(err);
    }

    query.startDate = moment(query.startDate).format('YYYY-MM-DD');
  }

  if (query.endDate) {
    if (!moment(query.endDate).isValid) {
      const err = new Error(`Invalid endDate paramter: ${query.endDate}`);
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
