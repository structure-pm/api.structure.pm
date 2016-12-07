import Moment from 'moment';
import engine from '../../engine';

export default {
  render: function(data) {
    const header = renderHeader();
    const body = renderBody({lines: data});
    const table = renderTable({body, header});

    return table;
  }
}

export const tableTemplate = `
<table>
  {{{header}}}
  {{{body}}}
</table>
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
    <td>{{income}}</td>
    <td>{{expense}}</td>
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


engine.registerHelper('formatDate', function(dt, format) {
  return Moment(dt).format(format);
});
