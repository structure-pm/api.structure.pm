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
