import ProfitLossCashDef from './profitloss_cash';
import ProfitLossAccrualDef from './profitloss_accrual';
import GlobalLedgerDef from './global_ledger';
import AssetManagerReportDef from './asset_manager';

const _reportDefs = {
  [ProfitLossCashDef.name]: ProfitLossCashDef,
  [ProfitLossAccrualDef.name]: ProfitLossAccrualDef,
  [GlobalLedgerDef.name]: GlobalLedgerDef,
  [AssetManagerReportDef.name]: AssetManagerReportDef,
};

const ReportDefs = {}
export default ReportDefs;

ReportDefs.get = function(name) {
  const reportDef = _reportDefs[name];
  if (!reportDef) throw new Error(`Unknown report definition '${name}'`);
  return reportDef;
};

ReportDefs.list = function() {
  return Object.keys(_reportDefs).map(key => _reportDefs[key]);
}
