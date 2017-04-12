import ProfitLossCash from './dataServices/profitLoss_cash';
import ProfitLossAccrual from './dataServices/profitLoss_accrual';
import GlobalLedger from './dataServices/global_ledger';
import AssetManager from './dataServices/asset_manager';
import TenantsOwing from './dataServices/tenants_owing';
import MaintenanceLabor from './dataServices/maintenance_labor';

const dataServices = {
  profitloss: ProfitLossCash,
  profitloss_cash: ProfitLossCash,
  profitloss_accrual: ProfitLossAccrual,
  global_ledger: GlobalLedger,
  asset_manager: AssetManager,
  tenants_owing: TenantsOwing,
  maintenance_labor: MaintenanceLabor,
};


const DatasetService = {};
export default DatasetService;

DatasetService.get = function(dataSetname="", options) {
  const dsKey = dataSetname.toLowerCase();

  if (!dataServices[dsKey]) {
    throw new Error(`Unkown dataset: '${dataSetname}'`);
  }

  return dataServices[dsKey](options);
}
