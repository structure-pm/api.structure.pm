
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
    <th>locationID</th>
    <th>locationName</th>
    <th>unitNumber</th>
    <th>entryDate</th>
    <th>income</th>
    <th>expense</th>
    <th>isReconciled</th>
    <th>payeeVendorName</th>
    <th>incomeID</th>
    <th>expenseID</th>
    <th>glAccountName</th>
    <th>leaseID</th>
    <th>comment</th>
    <th>method</th>
  </tr>
</thead>
`;

export const lineTemplate = `
  <tr>
    <td>{{entryID}}</td>
    <td>{{ownerID}}</td>
    <td>{{locationID}}</td>
    <td>{{locationName}}</td>
    <td>{{unitNumber}}</td>
    <td>{{entryDate}}</td>
    <td>{{income}}</td>
    <td>{{expense}}</td>
    <td>{{isReconciled}}</td>
    <td>{{payeeVendorName}}</td>
    <td>{{incomeID}}</td>
    <td>{{expenseID}}</td>
    <td>{{glAccountName}}</td>
    <td>{{leaseID}}</td>
    <td>{{comment}}</td>
    <td>{{method}}</td>
  </tr>
`;

export const bodyTemplate = `
{{#each lines}}
  {{>ledgerLine this}}
{{/each}}
`;
