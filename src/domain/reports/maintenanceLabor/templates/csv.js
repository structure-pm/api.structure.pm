
import engine from '../../engine'

export default {
  render: function(data) {
    const renderReport = engine.compile(reportTemplate);

    const columns = require('./columns')
    const headers = columns.getHeaders();
    const lines = columns.getLines(data);


    return renderReport({ lines:  [headers].concat(lines)});
  }
}


export const lineTemplate = `{{#each this}}"{{{this}}}",{{/each}}`;
export const reportTemplate = `{{#each lines}}${lineTemplate}\n{{/each}}`;
