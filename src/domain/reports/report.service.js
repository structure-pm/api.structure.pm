import Promise from 'bluebird';
import GeneralListTemplate from './generalListTemplate';
import GeneralTableTemplate from './generalTableTemplate';
import GlobalLedger from './globalLedger';
import AssetManager from './assetManager';
import ReportDefs from './reportDefinitions';
import Datasets from './reportData.service';

const _templates = {
  general_list: GeneralListTemplate,
  general_table: GeneralTableTemplate,
  global_ledger: GlobalLedger,
  asset_manager: AssetManager,
}

export function runReport(reportName, userParameters={}, userConfiguration={}, reportFormat='html', data=null) {
  const options = Promise.try(() => {
    const report = ReportDefs.get(reportName);

    const {defaultParameters, defaultConfiguration} = report;
    const parameters = Object.assign({}, defaultParameters, userParameters);
    const configuration = Object.assign({}, defaultConfiguration, userConfiguration);

    return {report, parameters, configuration};
  })

  const dataset = options.then(options => {
    return (Array.isArray(data))
      ? Promise.resolve({data})
      : Datasets.get(options.report.dataset.name, options.parameters);
  });

  return Promise.all([ options, dataset ])
    .then(([ options, dataset ]) => {
      const template = _templates[options.report.template];
      if (!template) throw new Error(`Unkonwn report template '${options.report.template}'`);

      const {parameters, configuration} = options;
      return new template(parameters, configuration, dataset, reportFormat)
    })
    .then(report => report.render())
}

export function render(reportName, reportFormat, options, dataSet) {
  reportName = 'general'; // this is the only report supported at this time


  const report = new GeneralListTemplate(options, dataSet, reportFormat);
  return Promise.resolve()
    .then(() => report.render())
}


export function listRegisteredReports(reportIds) {
  return Promise.try(() => {
    return ReportDefs.list();
  })
  .then(reports => {
    if (!reportIds || reportIds.length === 0) return reports;
    return reports.filter(r => reportIds.indexOf(r.name) !== -1);
  })
}

/**
 * Update the report `columns` definition with the partitions
 * data.  If `partition` is set in options, then the partitions
 * returned from the dataset will override any template setting
 */
function updateColumnsWithPartition(options, partitions) {
  if (!options.partition) return options.columns
}
