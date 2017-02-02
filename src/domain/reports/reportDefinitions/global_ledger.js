const GlobalLedgerDef = {
  name: 'global_ledger',
  display: 'Global Ledger',
  template: 'global_ledger',
  dataset: {name: 'global_ledger'},
  parametersDef: {
    type: "object",
    properties: {
      dateRange: {
        type      : "object",
        required  : ["startDate", "endDate"],
        ui        : {field: "dateRange"},
        properties: {
          name     : {type: "string"},
          startDate: {type: "string"},
          endDate  : {type: "string"}
        }
      },
      managerID: {
        type: "string",
        title: "managerID",
        ui: {
          defaultToGlobal: 'managerID',
          hideOnDefault: true,
        }
      },
    }
  },
  outputs: ['csv'],
}

export default GlobalLedgerDef;
