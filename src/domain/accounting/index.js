import IncomeRepo from './income.repository';

const Accounting = {};
export default Accounting;

Accounting.addIncome = function(data) {
  return IncomeRepo.create(data)
    .then(income => IncomeRepo.save(income));
}
