const AssetManagerReportDef = {
  name: 'asset_manager',
  display: 'Asset Manager Report',
  template: 'asset_manager',
  dataset: {name: 'asset_manager'},
  parametersDef: {
    type: "object",
    properties: {
      reportDate: {
        type      : "string",
        ui        : {widget: "date"},
      },
      ownerIDs: {
        type: "array",
        title: "Owners",
        items: {
          type: "string",
          enum: ["poi", "glenmary", "kinghenry"],
        },
        uniqueItems: true
      },
    }
  },
  outputs: ['csv'],
}

export default AssetManagerReportDef;
