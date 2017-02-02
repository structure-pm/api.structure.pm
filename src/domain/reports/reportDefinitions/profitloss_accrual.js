


const defaultConfig = {
  reportTitle: "Profit Loss",
  basis: "accrual",
  detail: "{{accountCode}} - {{{accountName}}}",
  columnDetail: "{{toMoney value}}",
  columnHeaders: [
    "Column ?"
  ],
  "root": {
    "footer": {
      "detail": "NET CASH FLOW",
      "columns": "normalSum",
      "columnDetail": "{{toMoney value}}"
    },
    "aggregates": {
      "normalSum": true
    }
  },
  "groupBy": [
    {
      "selector": "accountOperating",
      "sortBy": "",
      "header": {
        "detail": "{{key}}"
      },
      "footer": {
        "detail": "NET {{uppercase key}}",
        "columns": "normalSum",
        "columnDetail": "{{toMoney value}}",
      },
      "aggregates": {
        "sum": true,
        "normalSum": true,
        // "netIncome": "{{getColumn 'income.sum' default=0}} - {{getColumn 'expense.sum' default=0}}",
      }
    },
    {
      "selector": "accountType",
      "sortBy": "",
      "header": {
        "detail": "{{capitalize key}}"
      },
      "footer": {
        "detail": "TOTAL {{uppercase key}}",
        "columns": "absSum",
      },
      "aggregates": {
        "absSum": true
      }
    },
    {
      "selector": "accountGroup",
      "header": {
        "detail": "{{key}}"
      },
      "footer": {
        "detail": "TOTAL {{uppercase key}}",
        "columns": "absSum",
      },
      "aggregates": {
        "absSum": true
      }
    }
  ]
}


const profitLossAccrualDef = {
  name: 'profitloss_accrual',
  display: 'Profit/Loss (accrual basis)',
  template: 'general_list',
  dataset: {name: 'profitloss_accrual'},
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
      partition: {
        type: "string",
        title: "Group Columns by",
        enum: ['', 'month', 'quarter', 'year', 'location'],
        enumNames: ['- None -', 'Month', 'Quarter', 'Year', 'Location'],
      },
      ownerID: {
        type: "string",
        title: "OwnerID",
        ui: {
          defaultToGlobal: 'ownerID',
          hideOnDefault: true,
        }
      },
      reportFor: {
        type: "string",
        title: "Report For",
        ui: {
          defaultToGlobal: 'reportFor',
          hideOnDefault: true,
        }
      },
    }
  },
  outputs: ['csv'],
}

export default profitLossAccrualDef;
