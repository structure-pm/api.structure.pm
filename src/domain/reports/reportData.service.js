import ProfitLossCash from './dataServices/profitLoss_cash';
import ProfitLossAccrual from './dataServices/profitLoss_accrual';

const dataServices = {
  profitloss: ProfitLossCash,
  profitloss_cash: ProfitLossCash,
  profitloss_accrual: ProfitLossAccrual,
};



export function get(dataSetname="", options) {
  const dsKey = dataSetname.toLowerCase();

  if (!dataServices[dsKey]) {
    throw new Error(`Unkown dataset: '${dataSetname}'`);
  }

  return dataServices[dsKey](options);
}
