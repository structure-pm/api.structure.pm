import * as db from '../../../db';
import moment from 'moment';

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
        uniqueItems: true,
        ui: {
          widget: 'multiselect',
          cols: 6
        },
      },
    }
  },
  outputs: ['csv'],
  onInit: (def) => {
    const dbPrefix = db.getPrefix();
    const sql = `SELECT
        ownerID, COALESCE(nickname, lName, ownerID) as name
      FROM
        ${dbPrefix}_assets.owner
      WHERE
        managedBy = 'alltrade'
        AND active=1
        AND (nickname NOT LIKE '%DNM%' OR nickname IS NULL)
      ORDER BY
        COALESCE(nickname, lName, ownerID) ASC`;

    return db.query(sql).then(data => {
      def.parametersDef.properties.ownerIDs.items.enum = data.map(d => d.ownerID);
      def.parametersDef.properties.ownerIDs.items.enumNames = data.map(d => d.name);
      def.parametersDef.properties.reportDate.default = moment().format('YYYY-MM-DD');
      return def;
    })
  }
}

export default AssetManagerReportDef;
