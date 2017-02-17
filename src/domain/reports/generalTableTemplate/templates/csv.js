
import engine from '../../engine'

export default {
  render: function(data, headersDef) {
    const renderReport = engine.compile(reportTemplate);

    const headers = Object.keys(headersDef);
    const lines = data.map(d => headers.map(col => d[headersDef[col]]))


    return renderReport({ lines:  [headers].concat(lines)});
  }
}


export const lineTemplate = `{{#each this}}"{{{this}}}",{{/each}}`;
export const reportTemplate = `{{#each lines}}${lineTemplate}\n{{/each}}`;
