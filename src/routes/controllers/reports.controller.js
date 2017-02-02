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
  // Some links (eg. links to csv version of reports) need to send data via
  // application/x-www-form-urlencoded. In those cases, a single form field
  // is sent with the name 'json'.  The following lines handle both the
  // application/x-www-form-urlencoded and the application/json case
  const body = (req.body.json) ? JSON.parse(req.body.json) : req.body;

  const {name, parameters, configuration, format, data} = body;
  const reportFormat = format || req.query.format || body.format || 'html';
  reportSvc.runReport(name, parameters, configuration, reportFormat, data)
    .then(output => {
      console.log("FORMAT", reportFormat, format);
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
