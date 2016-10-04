import Moment from 'moment';
import * as reportSvc from '../../domain/reports/report.service';
import * as reportDataSvc from '../../domain/reports/reportData.service';
/**
 * const report = {
 *   reportHeader: "{{handlebars}}",
 *   reportFooter: "{{}}",
 *   pageHeader: "",
 *   pageFooter: "",
 *   groupBy: {
 *     field: '',
 *     groupHeader: "",
 *     groupFooter: "",
 *     sortBy: "",
 *     groupBy: {}
 *   },
 *   sortBy:"",
 *   detail:"",
 *   items: []
 * }
 **/

export function renderReport(req, res, next) {
  let dataset = req.body.dataset,
      report = req.body.report,
      reportFormat = req.body.format || 'html';

  if (!dataset) {
    const err = new Error("Structure Reporting requires a missing data definition field (`dataset`) to proceed.");
    err.status = 400;
    return next(err);
  }

  if (!report) {
    const err = new Error("Structure Reporting requires a missing report definition field (`report`) to proceed.");
    err.status = 400;
    return next(err);
  }

  if (!dataset.filter || !dataset.filter.ownerID) {
    const msg = `Currently, Structure Reporting can only provide reports for a single owner at a time.
      Please provide an 'ownerID' field in the dataset.filter object.`;
    const err = new Error(msg);
    err.status = 400;
    return next(err);
  }

  dataset.filter.startDate = dataset.filter.startDate || moment().startOf('year');
  dataset.filter.endDate = dataset.filter.endDate || moment().endOf('year');

  reportDataSvc.get(dataset.name, dataset)
    .then(data => reportSvc.render(report.name, reportFormat, report, data))
    .then(output => {
      res.send(output);
    })
    .catch(next);
}
