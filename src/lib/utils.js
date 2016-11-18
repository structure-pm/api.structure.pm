import Moment from 'moment';

export function formatDateForDb(date) {
  let formattedDate = date;
  if (!formattedDate) {
    formattedDate = Moment();
  } else if (typeof formattedDate === 'string') {
    formattedDate = Moment(formattedDate, ["MM-DD-YYYY", "YYYY-MM-DD"])
  } else {
    formattedDate = Moment(formattedDate);
  }
  return formattedDate.format('YYYY-MM-DD');
}

// Here's how structure handles the first month of a lease:
// if the start date is later than the 15th, charge no rent
// if the start date is before on on the 15th, charge full rent
// This is generally wrong, since leasing agents want to prorate
// the first month of rent.
//
// UNFORTUNATELY, since rent "invoices" are calculated on the fly
// every time a balance is calculated, changing this calculation will
// alter the balance for every tenant in the system.  Thus, we stick
// with the wrong solution until 2.0.
export function rentPeriods(start, end) {
  start = Moment(start);
  end = Moment(end).endOf('month').add(1, 'day');
  const dayOfMonth = start.date();

  if (dayOfMonth > 15) {
    start = start.endOf('month').add(1, 'day');
  } else {
    start = start.startOf('month');
  }
  return end.diff(start, 'month');
}
