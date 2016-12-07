import Moment from 'moment';
import path from 'path';
import sass from 'node-sass';
import engine from '../../engine';


const styleFile = path.join(__dirname, 'style.scss');
const style = sass.renderSync({ file: styleFile }).css.toString('utf8');

export default {
  render: function(data) {
    const header = renderHeader();
    const body = renderBody({lines: data});
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
    <table>
      {{{header}}}
      {{{body}}}
    </table>
  </div>
</div>
`

export const headerTemplate = `
<thead>
  <tr>
    <th>entryID</th>
    <th>ownerID</th>
    <th>locationName</th>
    <th>Unit#</th>
    <th>entryDate</th>
    <th>income</th>
    <th>expense</th>
    <th>Rec</th>
    <th>Cust/Vend</th>
    <th>Account</th>
    <th>comment</th>
    <th>method</th>
  </tr>
</thead>
`;

export const lineTemplate = `
  <tr>
    <td>{{entryID}}</td>
    <td>{{ownerID}}</td>
    <td>{{locationName}}</td>
    <td>{{unitNumber}}</td>
    <td>{{formatDate entryDate 'YYYY-MM-DD'}}</td>
    <td>{{toMoney income}}</td>
    <td>{{toMoney expense}}</td>
    <td>{{isReconciled}}</td>
    <td>{{payeeVendorName}}</td>
    <td>{{{glAccountName}}}</td>
    <td>{{comment}}</td>
    <td>{{method}}</td>
  </tr>
`;

export const bodyTemplate = `
{{#each lines}}
  {{>ledgerLine this}}
{{/each}}
`;

engine.registerPartial('ledgerLine', lineTemplate);
const renderTable = engine.compile(tableTemplate);
const renderHeader = engine.compile(headerTemplate);
const renderBody = engine.compile(bodyTemplate);
