import Promise from 'bluebird';
import handlebars from 'handlebars';
import registerHelpers from './helpers'
import style from './style';
import absurd from 'absurd';

registerHelpers(handlebars);

const reportTemplate = `
<style>
  {{{style}}}
</style>
<div class="report-wrapper">
  <header class="report-header">
    {{{ header }}}
  </header>
  <article class="report-content">
    {{{content}}}
  </article>
  <footer class="report-footer">
    {{{ footer }}}
  </footer>
</div>`;
const reportHeaderTemplate = `
  <div class="report-title">
    <h1>{{ reportTitle }}</h1>
    <h2>{{ reportFor }}</h2>
  </div>`;
const groupTemplate = `
  {{{groupHeader}}}
  <ul class="report-group">
    {{{content}}}
  </ul>
  {{{groupFooter}}}
`;
const lineTemplate = `
  <li class="report-line {{lineClass}}">
    <div class="report-line-detail">
      {{{detail}}}
    </div>
    <div class="report-line-columns">
      {{{columns}}}
    </div>
  </li>`;
const columnsTemplate = `
  {{#each this}}
    <div class="report-line-column column-{{@index}}">
      {{this}}
    </div>
  {{/each}}
`;

const renderLine = handlebars.compile(lineTemplate);
const renderGroup = handlebars.compile(groupTemplate);
const renderColumns = handlebars.compile(columnsTemplate);

export default function renderGeneralListReport(options, data) {
  const groupings = normalizeGroups(options.groupBy, options);
  const renderItemColumns = compileColumns(options.columns);
  const groups = applyGroupBy(groupings, data);
  const grouping = (groupings && groupings.length) ? groupings[0] : null;
  const groupOrder = (grouping)
    ? sortGroups(Object.keys(groups), grouping.sortBy)
    : null;
  const report = Object.assign({}, options, {
    groupBy: groupings,
    renderColumns: renderItemColumns,
    items: data,
    groups: groups,
    groupOrder: groupOrder,
  });

  const reportHeader = handlebars.compile(report.reportHeader || reportHeaderTemplate || '');
  const reportFooter = handlebars.compile(report.reportFooter || '');

  return new Promise((resolve, reject) => {
    absurd(style).compile((err, css) => {
      if (err) return reject(err);

      const html = handlebars.compile(reportTemplate)({
        header: reportHeader(report),
        footer: reportFooter(report),
        // content: buildGroups(report.groups, report),
        content: buildGroup(report, report),
        style: css
      });

      resolve(html)
    })
  })


}



/**
 * Applies common fields to all groupings
 */
export function normalizeGroups(groupings, options) {
  if (!groupings) return groupings;

  return groupings.map(grouping => Object.assign(
    {
      renderHeaderColumns: compileColumns(grouping.headerColumns),
      renderFooterColumns: compileColumns(grouping.footerColumns),
    },
    grouping
  ));
}

export function compileColumns(columns) {
  if (!columns) return null;
  if (!Array.isArray(columns)) columns = [columns];
  return columns.map(col => handlebars.compile(col));
}

export function getAggregates(group) {
  const agg = group.grouping.aggregates || {};
  const aggregates = {};
  // sum
  if (agg.sum) {
    aggregates.sum = group.items.reduce((sum, item) => sum + item[agg.sum],0);
  }
  // TODO: max
  // TODO: min
  // TODO: mean
  return aggregates;
}

export function applyGroupBy(groupings, data) {
  if (!groupings || !groupings.length) return null;
  if (!Array.isArray(groupings)) groupings = [groupings];

  const grouping = groupings[0];
  const nextGroupings = groupings.slice(1);
  const groups = groupBy(data, grouping.selector);
  Object.keys(groups).forEach(key => {
    const group = groups[key];
    group.grouping = grouping;
    group.aggregates = getAggregates(group);
    group.groups = applyGroupBy(nextGroupings, group.items);
    if (group.groups) {
      group.groupOrder = sortGroups(Object.keys(group.groups), grouping.sortBy);
    }
    group.headerColumns = (grouping.renderHeaderColumns) ? grouping.renderHeaderColumns.map(render => render(group)) : null;
    group.footerColumns = (grouping.renderFooterColumns) ? grouping.renderFooterColumns.map(render => render(group)) : null;
  }, {});

  return groups;
}

function sortDesc(a, b) {
  if (a>b) return -1;
  else if (a<b) return 1;
  else return 0;
}

function sortAry(ary) {
  return function(a, b) {
    let idxA = ary.findIndex(aryItem => aryItem === a);
    let idxB = ary.findIndex(aryItem => aryItem === b);
    return idxA - idxB;
  }
}

function sortGroups(groupKeys, sortBy) {
  let sorted = groupKeys.slice(0);

  if (sortBy.toLowerCase() === 'asc') {
    sorted.sort();
  } else if (sortBy.toLowerCase() === 'desc') {
    sorted.sort(sortDesc);
  } else if (typeof sortBy === 'function' ) {
    sorted.sort(sortBy);
  } else if (Array.isArray(sortBy)) {
    sorted.sort(sortAry(sortBy));
  }

  return sorted;
}

function renderGroupColumns(group, columns) {
  const groupColumns = {totals: [], max: [], min: [], mean: []}
  columns.forEach(col => {
    // Totals
    if (col.total) {
      const total = group.items.reduce((sum, item) => sum + item[col.field], 0);
      groupColumns.totals.push(col.renderDetail(total));
    } else {
      groupColumns.totals.push('');
    }
    // TODO: max
    // TODO: min
    // TODO: mean
  });
  return groupColumns;
}


/**
 * Group a collection of objects based on the selector function
 * @param  {Collection} col   Array of object
 * @param  {Function|String} selector Function
 * @return {Array}          Array of groups
 *
 * Groups have the format:
 * {
 * 	key: String - the key on which the group was made
 * 	items: collection of items in the group
 * }
 */
export function groupBy( items , selector ) {
  const itemGroups = {};
  if (typeof selector === 'string') {
    const field = selector;
    selector = item => item[field];
  }


  items.forEach( item => {
    var groupKey = selector(item);
    itemGroups[groupKey] = itemGroups[groupKey] || [];
    itemGroups[groupKey].push( item );
  });

  return Object.keys(itemGroups).reduce( (groups, groupKey) => {
    groups[groupKey] = {
      key: groupKey,
      items: itemGroups[groupKey]
    };
    return groups;
  }, {});
}




// function buildGroups(groups, report) {
//   return Object
//     .keys(groups)
//     .map(key => buildGroup(groups[key], report))
//     .join('\n');
// }


function buildGroup(group, def) {
  const currentGrouping = group.grouping || {};
  const renderGroupHeaderDetail = handlebars.compile(currentGrouping.groupHeader || '');
  const renderGroupFooterDetail = handlebars.compile(currentGrouping.groupFooter || '');
  const headerContext = {
    lineClass: "report-group-header",
    detail: renderGroupHeaderDetail(group),
    columns: group.headerColumns
  };
  const footerContext = {
    lineClass: "report-group-footer",
    detail: renderGroupFooterDetail(group),
    columns: group.footerColumns
  };


  let content;
  if (group.groups) {
    content = (group.groupOrder || Object.keys(groups))
      .map(key => buildGroup(group.groups[key], def))
      .join('\n');
  } else {
    content = renderItems(group.items, def.detail, def.renderColumns);
  }
  const groupHeader = (currentGrouping.groupHeader) ? renderLine(headerContext) : '';
  const groupFooter = (currentGrouping.groupFooter) ? renderLine(footerContext) : '';
  // const content = (group.groups)
  //   ? buildGroups(group.groups, def)
  //   : renderItems(group.items, def.detail, def.renderColumns);

  return renderGroup({groupHeader, groupFooter, content});
}


function renderItems(items, template, renderColumnFns) {
  const renderItemDetail = handlebars.compile(template);

  return items
    .map(item => renderLine({
      lineClass: 'report-item',
      detail: renderItemDetail(item),
      columns: renderColumnFns.map(render => render(item))
    }))
    .join('\n');
}
