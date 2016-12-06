import {Readable} from 'stream';
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

export function runReport(req, res, next) {
  const {name, parameters, configuration, format, data} = req.body;
  const reportFormat = format || req.query.format || body.format || 'html';

  reportSvc.runReport(name, parameters, configuration, reportFormat, data)
    .then(output => {
      if (reportFormat === 'html') {
        res.send(output);
      } else if (reportFormat === 'csv') {
        res.attachment('report.csv');

        const reportStream = new Readable();
        reportStream.pipe(res);
        reportStream.push(output);
        reportStream.push(null);
      } else {
        throw new Error(`Unknown format type ${reportFormat}`)
      }
    })
    .catch(next);
}

export function renderReport(req, res, next) {
  let body;
  if (req.body.json) {
    body = JSON.parse(req.body.json);
  } else {
    body = req.body;
  }

  const {report, dataset} = body;
  const reportFormat = req.query.format || body.format || 'html';
  const {reportName} = report;

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
    .then(results => reportSvc.render(report.name, reportFormat, report, results))
    .then(output => {
      if (reportFormat === 'html') {
        res.send(output);
      } else if (reportFormat === 'csv') {
        res.attachment('report.csv');

        const reportStream = new Readable();
        reportStream.pipe(res);
        reportStream.push(output);
        reportStream.push(null);
      } else {
        throw new Error(`Unknown format type ${reportFormat}`)
      }
    })
    .catch(next);
}


export function getReportDefinitions(req,res,next) {
  reportSvc.listRegisteredReports()
    .then(defs => res.json(defs))
    .catch(next);
}

export function getDataservice(req, res, next) {
  const {dataserviceName} = req.params;
  const options = req.query;

  reportDataSvc.get(dataserviceName, options)
    .then(results => res.json(results))
    .catch(next);
}
