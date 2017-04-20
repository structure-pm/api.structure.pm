import Moment from 'moment';
import path from 'path';
import sass from 'node-sass';
import engine from '../../engine';


const styleFile = path.join(__dirname, 'style.scss');
const style = sass.renderSync({ file: styleFile }).css.toString('utf8');



export default {
  render: function(data) {

    const columns = require('./columns')
    const headers = columns.getHeaders();
    const lines = columns.getLines(data);

    const header = renderHeader({headers});
    const body = renderBody({lines});
    const table = renderTable({body, header, style});

    return table;
  }
}


export const tableTemplate = `
<style>
  {{{style}}}
</style>
<div class="report-wrapper">
  <div class="report-content">
    <table class="table account_manager_data">
      {{{header}}}
      {{{body}}}
    </table>
  </div>
</div>
`;

export const headerTemplate = `
<thead>
  <tr>
    {{#each headers}}
    <th>{{{this}}}</th>
    {{/each}}
  </tr>
</thead>
`
export const bodyTemplate = `
<tbody>
{{#each lines}}
  <tr>
    {{#each this}}
    <td>{{{this}}}</td>
    {{/each}}
  </tr>
{{/each}}
</tbody>
`;

const renderTable = engine.compile(tableTemplate);
const renderHeader = engine.compile(headerTemplate);
const renderBody = engine.compile(bodyTemplate);
