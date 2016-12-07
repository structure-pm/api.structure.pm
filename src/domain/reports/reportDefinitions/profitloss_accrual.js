


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
  parameters: {
    reportFor: 'string',
    dateRange: {
      startDate: 'date',
      endDate: 'date',
      rangeName: 'string',
    },
    partition: 'string',
    ownerID: 'string',
  },
  defaultConfiguration: defaultConfig,
  defaultParameters: {}
}

export default profitLossAccrualDef;
