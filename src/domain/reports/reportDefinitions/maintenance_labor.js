import * as db from '../../../db';
import moment from 'moment';

const MaintenanceLaborReportDef = {
  name: 'maintenance_labor',
  display: 'Maintenance Labor Report',
  template: 'maintenance_labor',
  dataset: {name: 'maintenance_labor'},
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
    }
  },
  outputs: ['csv'],
}

export default MaintenanceLaborReportDef;
