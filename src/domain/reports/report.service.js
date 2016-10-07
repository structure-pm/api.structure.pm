import Promise from 'bluebird';
import renderGeneralListReport from './generalListTemplate';

export function render(reportName, reportFormat, options, data) {
  reportName = 'general'; // this is the only report supported at this time


  return Promise.resolve()
    .then(() => renderGeneralListReport(options, data, reportFormat) )
}
