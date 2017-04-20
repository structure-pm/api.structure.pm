// domain/reports/assetManager/templates/columns.js

function toPercent(p=0) {
  return (Number(p||0)*100).toFixed(1) + "%"
}

function toDollars(p) {
  let [integer, decimal] = Number(p || 0).toFixed(2).split('.');

  integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return '$' + integer + '.' + decimal;
};

function toDecimal(p) {
  var n = Math.abs(p);
  var dec = n - Math.floor(n);
  dec = ( Math.round( dec * 100 ) / 100 ).toString();

  if( dec.split('.').length ) {
    return dec.split('.')[1];
  } else return "";
};



const columns = [
  { prop: null,                 display: 'Name', value: data => [data.firstName, data.lastName].filter(a=>a).join(' ') },
  { prop: 'total_work_time',    display: 'Total Hours Worked' },
  { prop: 'total_jobs_closed',  display: 'Jobs Closed' },
];

exports = module.exports = {
  columns,
  getLines: (data) => data.map(d => columns.map(col => (col.value) ? col.value(d) : d[col.prop])),
  getHeaders: () => columns.map(col => col.display),
}
