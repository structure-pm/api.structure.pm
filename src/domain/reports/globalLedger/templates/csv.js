import engine from '../../engine'

export default {
  render: function(data) {

    const header = renderHeader();
    const body = renderBody(data);
    const csv = renderReport({header, body});

    return csv;
  }
}

const reportTemplate = `{{{header}}}\n{{{body}}}`

const headerTemplate = [
  'entryID',
  'Owner Name',
  'locationName',
  'unitNumber',
  'entryDate',
  'income',
  'expense',
  'isReconciled',
  'payeeVendorName',
  // 'incomeID',
  // 'expenseID',
  'glAccountName',
  'leaseID',
  'comment',
  'method'
].join(',');

const lineTemplate = [
  '{{{entryID}}}',
  '{{{ownerName}}}',
  '{{{locationName}}}',
  '{{{unitNumber}}}',
  '{{{formatDate entryDate "YYYY-MM-DD"}}}',
  '{{{toMoney income}}}',
  '{{{toMoney expense}}}',
  '{{{isReconciled}}}',
  '{{{payeeVendorName}}}',
  // '{{{incomeID}}}',
  // '{{{expenseID}}}',
  '{{{glAccountName}}}',
  '{{{leaseID}}}',
  '{{{comment}}}',
  '{{{method}}}',
].map(line => `"${line}"`).join(',');

const bodyTemplate = `{{#each this}}${lineTemplate}\n{{/each}}`;

const renderReport = engine.compile(reportTemplate)
const renderHeader = engine.compile(headerTemplate);
const renderBody = engine.compile(bodyTemplate);
