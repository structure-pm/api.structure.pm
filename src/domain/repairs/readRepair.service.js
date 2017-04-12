

export const ReadRepair = {
  useDb: function(dbService) {this.dbService = dbService},
  search: function(query) {
    return this.dbService.search(query);
  },
  getRepairTypes: function() {
    return this.dbService.getRepairTypes()
      .then(rows => rows.map(row => row.repairType).filter(rt => rt))
  }

}
