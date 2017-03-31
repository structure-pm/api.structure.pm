

export const ReadRepair = {
  useDb: function(dbService) {this.dbService = dbService},
  search: function(query) {
    return this.dbService.search(query);
  }

}
