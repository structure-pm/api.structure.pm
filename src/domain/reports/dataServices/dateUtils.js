import Moment from 'moment';

export function monthsBetween(startDate, endDate) {
  return nBetween('month', startDate, endDate);
}

export function quartersBetween(startDate, endDate) {
  return nBetween('quarter', startDate, endDate);
}

export function yearsBetween(startDate, endDate) {
  return nBetween('year', startDate, endDate);
}

export function nBetween(period, startDate, endDate) {
  const start = Moment(startDate);
  const end = Moment(endDate);
  const checkDate = start.startOf(period);
  const periods = [];
  while (checkDate < end) {
    periods.push(checkDate.toDate());
    checkDate.add(1, period);
  }
  return periods;

}
