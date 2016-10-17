import Promise from 'bluebird';
import GeneralListTemplate from './generalListTemplate';

export function render(reportName, reportFormat, options, dataSet) {
  reportName = 'general'; // this is the only report supported at this time


  const report = new GeneralListTemplate(options, dataSet, reportFormat);
  return Promise.resolve()
    .then(() => report.render())
}

/**
 * Update the report `columns` definition with the partitions
 * data.  If `partition` is set in options, then the partitions
 * returned from the dataset will override any template setting
 */
function updateColumnsWithPartition(options, partitions) {
  if (!options.partition) return options.columns
}
