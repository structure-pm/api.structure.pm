import * as db from '../../../db';
import moment from 'moment';

const AssetManagerReportDef = {
  name: 'tenants_owing',
  display: 'Tenants with Balance',
  template: 'general_table',
  dataset: {name: 'tenants_owing'},
  parametersDef: {
    type: "object",
    properties: {
      minBalance: {
        type      : "number",
        default: 0
      },
      ownerIDs: {
        type: "array",
        title: "Owners",
        items: {
          type: "string",
          enum: ["poi", "glenmary", "kinghenry"],
        },
        uniqueItems: true,
      },
    }
  },
  defaultConfiguration: {
    headers: {
      'Tenant ID': 'tenantID',
      'First Name': 'firstName',
      'Last Name': 'lastName',
      'Address': 'address',
      'Email': 'email',
      'Phone': 'phone',
      'Alt. Phone': 'altPhone',
      'Rent Balance': 'balance',
      'Owner': 'owner',
      'Lease Start': 'startDate',
      'Lease End': 'endDate',
      'Rent Amount': 'rent',
      'Other Lease Charges': 'lFees',
      'Deposit Amount': 'deposit',
    },
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
        AND nickname NOT LIKE '%DNM%'
      ORDER BY
        COALESCE(nickname, lName, ownerID) ASC`;

    return db.query(sql).then(data => {
      def.parametersDef.properties.ownerIDs.items.enum = data.map(d => d.ownerID);
      def.parametersDef.properties.ownerIDs.items.enumNames = data.map(d => d.name);
      return def;
    })
  }
}

export default AssetManagerReportDef;
