import ProfitLossCashDef from './profitloss_cash';
import ProfitLossAccrualDef from './profitloss_accrual';
import GlobalLedgerDef from './global_ledger';
import AssetManagerReportDef from './asset_manager';
import TenantsOwing from './tenants-owing';
import MaintenanceLabor from './maintenance_labor';

const _reportDefs = {
  [ProfitLossCashDef.name]: ProfitLossCashDef,
  [ProfitLossAccrualDef.name]: ProfitLossAccrualDef,
  [GlobalLedgerDef.name]: GlobalLedgerDef,
  [AssetManagerReportDef.name]: AssetManagerReportDef,
  [TenantsOwing.name]: TenantsOwing,
  [MaintenanceLabor.name]: MaintenanceLabor,
};

const ReportDefs = {}
export default ReportDefs;

ReportDefs.get = function(name) {
  const reportDef = _reportDefs[name];
  if (!reportDef) throw new Error(`Unknown report definition '${name}'`);
  return reportDef;
};

ReportDefs.list = function() {
  return Promise.all(Object.keys(_reportDefs).map(key =>{
    const def = _reportDefs[key];
    return (def.onInit) ? def.onInit(def) : def;
  }));
}
