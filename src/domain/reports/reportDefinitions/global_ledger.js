const GlobalLedgerDef = {
  name: 'global_ledger',
  display: 'Global Ledger',
  template: 'global_ledger',
  dataset: {name: 'global_ledger'},
  parameters: {
    dateRange: {
      startDate: 'date',
      endDate: 'date',
      rangeName: 'string',
    },
    managerID: 'string',
  },
  defaultConfiguration: {},
  defaultParameters: {}
}

export default GlobalLedgerDef;
