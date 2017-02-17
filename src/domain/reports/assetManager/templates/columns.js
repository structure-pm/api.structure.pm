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
  { prop: 'ownerID',              display: 'Owner ID' },
  { prop: 'units_count',          display: 'Units Total', },
  { prop: 'active_lease_count',   display: 'Units Occupied'},
  { prop: null,                   display: '% Occupied', value: data => toPercent(data.active_lease_count/data.units_count) },
  { prop: 'available_count',      display: 'Vacant Rent Ready', },
  { prop: null,                   display: 'Sched. Move ins', value: data=> '??' },
  { prop: null,                   display: 'Units under Eviction', value: data=> '??' },
  { prop: null,                   display: 'Applications Received', value: data=> '??' },
  { prop: 'vacating_lease_count', display: 'Units Vacating'},
  { prop: null,                   display: 'Rent Roll', value: data => toDollars(data.monthly_total) },
  { prop: null,                   display: 'Tenant Receivable', value: data => toDollars(data.tenant_balance) },
  { prop: null,                   display: '%AR of Rent Roll', value: data => toPercent(data.tenant_balance/data.monthly_total) },
  { prop: 'ap_over_90_count',     display: 'AP Over 90 days' },
  { prop: 'ap_over_60_count',     display: 'AP 60-89 days' },
  { prop: 'ap_over_30_count',     display: 'AP 30-59 days' },
  { prop: 'open_repairs_count',   display: 'Open Repairs' },
  { prop: 'vacant_over_90_count', display: 'Vacant Over 90 days' },
  { prop: 'vacant_over_60_count', display: 'Vacant 60-89 days' },
  { prop: 'vacant_over_30_count', display: 'Vacant 30-59 days' },
  { prop: null,                   display: 'Maintenance Exp / door / month', value: data => toDollars(data.year_exp_maintenance_total/data.units_count/12) },
  { prop: null,                   display: 'Utilities Exp / door / month', value: data => toDollars(data.year_exp_utilities_total/data.units_count/12) },
  { prop: null,                   display: 'Operations Exp / door / month', value: data => toDollars(data.year_exp_operations_total/data.units_count/12) },
  { prop: null,                   display: 'Capital Exp / door / month', value: data => toDollars(data.year_exp_capexp_total/data.units_count/12) },
];

exports = module.exports = {
  columns,
  getLines: (data) => data.map(d => columns.map(col => (col.value) ? col.value(d) : d[col.prop])),
  getHeaders: () => columns.map(col => col.display),
}
