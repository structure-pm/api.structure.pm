import Moment from 'moment';
import path from 'path';
import sass from 'node-sass';
import engine from '../../engine';


const styleFile = path.join(__dirname, 'style.scss');
const style = sass.renderSync({ file: styleFile }).css.toString('utf8');

const toPercent = p => p.toLocaleString('en-us', {
  style: 'percent', maximumSignificantDigits: 3
});
const toDollars = p => p.toLocaleString("en-GB", {
  style: "currency", currency: "USD", minimumFractionDigits: 2
});

export default {
  render: function(data) {

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
      // { prop: 'total_rent',           display: 'Total rent accrued'},
      // { prop: 'total_rent_addons',    display: 'Total rent addons accrued'},
      // { prop: 'total_fees',           display: 'Total fees accrued'},
      // { prop: 'total_adjustments',    display: 'Total adj accrued'},
      // { prop: 'total_payments',       display: 'Total payments'},
      // { prop: 'rent_receivable',      display: 'Tenant Receivable'},

    ]
    const headers = columns.map(col => col.display);
    const lines = data.map(d => columns.map(col => (col.value) ? col.value(d) : d[col.prop]));

    const header = renderHeader({headers});
    const body = renderBody({lines});
    const table = renderTable({body, header, style});

    return table;
  }
}


export const tableTemplate = `
<style>
  {{{style}}}
</style>
<div class="report-wrapper">
  <div class="report-content">
    <table class="table account_manager_data">
      {{{header}}}
      {{{body}}}
    </table>
  </div>
</div>
`;

export const headerTemplate = `
<thead>
  <tr>
    {{#each headers}}
    <th>{{{this}}}</th>
    {{/each}}
  </tr>
</thead>
`
export const bodyTemplate = `
<tbody>
{{#each lines}}
  <tr>
    {{#each this}}
    <td>{{{this}}}</td>
    {{/each}}
  </tr>
{{/each}}
</tbody>
`;

const renderTable = engine.compile(tableTemplate);
const renderHeader = engine.compile(headerTemplate);
const renderBody = engine.compile(bodyTemplate);
