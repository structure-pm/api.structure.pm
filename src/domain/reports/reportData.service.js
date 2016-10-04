import getProfitLoss from './dataServices/profitLoss';

const dataServices = {
  profitloss: getProfitLoss,
};



export function get(dataSetname="", options) {
  const dsKey = dataSetname.toLowerCase();

  if (!dataServices[dsKey]) {
    throw new Error(`Unkown dataset: '${dataSetname}'`);
  }

  return dataServices[dsKey](options);
}
