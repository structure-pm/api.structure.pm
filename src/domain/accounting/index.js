import IncomeRepo from './income.repository';

const Accounting = {};
export default Accounting;

Accounting.addIncome = function(data, dbOptions) {
  const income = IncomeRepo.create(data)
  return IncomeRepo.save(income, dbOptions);
}


Accounting.getUndepositedForOwner = function(ownerID) {

}
