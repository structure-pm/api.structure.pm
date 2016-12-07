import ProfitLossCash from './dataServices/profitLoss_cash';
import ProfitLossAccrual from './dataServices/profitLoss_accrual';
import GlobalLedger from './dataServices/global_ledger';

const dataServices = {
  profitloss: ProfitLossCash,
  profitloss_cash: ProfitLossCash,
  profitloss_accrual: ProfitLossAccrual,
  global_ledger: GlobalLedger,
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
