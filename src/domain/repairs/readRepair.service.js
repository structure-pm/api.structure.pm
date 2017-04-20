

export const ReadRepair = {
  useDb: function(dbService) {this.dbService = dbService},
  search: function(query, options) {
    return this.dbService.search(query, options);
  },
  getRepairTypes: function() {
    return this.dbService.getRepairTypes()
      .then(rows => rows.map(row => row.repairType).filter(rt => rt))
  },
  getMaintenanceZones: function(managerID) {
    return this.dbService.getMaintenanceZones(managerID);
  },
  getMaintenanceStaff: function(managerID) {
    return this.dbService.getMaintenanceStaff(managerID);
  },
  getEntriesForRepair: function(repairId) {
    return this.dbService.getEntriesForRepair(repairId);
  },
  createRepairEntry: function(entryData) {
    return this.dbService.createRepairEntry(entryData);
  },

}
