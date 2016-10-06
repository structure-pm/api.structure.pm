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
  <ul class="report-group group-level-{{groupLevel}}">
    {{{content}}}
  </ul>
  {{{groupFooter}}}
`;
const lineTemplate = `
  <li class="report-line {{lineClass}}">
    <div class="report-line-detail">
      {{{detail}}}
    </div>
    {{{columns}}}
  </li>`;

const columnsTemplate = `
  <div class="report-line-columns group-level-{{groupLevel}}">
    {{#each columns}}
      {{{this}}}
    {{/each}}
  </div>
`;

const columnTemplate = `
  <div class="report-line-column">
    {{value}}
  </div>
`;

const compiledColumn = handlebars.compile(columnTemplate);
const compiledColumns = handlebars.compile(columnsTemplate);

const renderLine = handlebars.compile(lineTemplate);
const renderGroup = handlebars.compile(groupTemplate);

function renderColumns(colVals, groupLevel) {
  if (!Array.isArray(colVals)) colVals = [colVals];

  return compiledColumns({
    columns: colVals.map(value => compiledColumn({value})),
    groupLevel: groupLevel
  });
}

export default function renderGeneralListReport(options, data) {
  const groupings = normalizeGroups(options.groupBy, options);
  const renderItemColumns = compileColumns(options.columns);
  const groups = applyGroupBy(groupings, data);
  const grouping = (groupings && groupings.length) ? groupings[0] : null;
  const groupOrder = (grouping)
    ? sortGroups(Object.keys(groups), grouping.sortBy)
    : null;

  const report = Object.assign({}, options, {
    compiledItemDetail: handlebars.compile(options.detail),
    compiledItemColumns: compileColumns(options.columns),
    groupBy: groupings,
    renderColumns: renderItemColumns,
    items: data,
    groups: groups,
    groupOrder: groupOrder,
    groupLevel: 0,
  });

  const reportHeader = handlebars.compile(report.reportHeader || reportHeaderTemplate || '');
  const reportFooter = handlebars.compile(report.reportFooter || '');

  return new Promise((resolve, reject) => {
    absurd(style).compile((err, css) => {
      if (err) return reject(err);

      const html = handlebars.compile(reportTemplate)({
        header: reportHeader(report),
        footer: reportFooter(report),
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
      compiledHeaderColumns: compileColumns(grouping.headerColumns),
      compiledFooterColumns: compileColumns(grouping.footerColumns),
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

export function applyGroupBy(groupings, data, level=1) {
  if (!groupings || !groupings.length) return null;
  if (!Array.isArray(groupings)) groupings = [groupings];

  const grouping = groupings[0];
  const nextGroupings = groupings.slice(1);
  const groups = groupBy(data, grouping.selector);
  Object.keys(groups).forEach(key => {
    const group = groups[key];
    group.groupLevel = level;
    group.grouping = grouping;
    group.aggregates = getAggregates(group);
    group.groups = applyGroupBy(nextGroupings, group.items, level+1);
    if (group.groups) {
      group.groupOrder = sortGroups(Object.keys(group.groups), grouping.sortBy);
    }
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



function buildGroup(group, def) {
  const currentGrouping = group.grouping || {};
  const renderGroupHeaderDetail = handlebars.compile(currentGrouping.groupHeader || '');
  const renderGroupFooterDetail = handlebars.compile(currentGrouping.groupFooter || '');

  const headerColumns = (currentGrouping.compiledHeaderColumns) ? currentGrouping.compiledHeaderColumns.map(render => render(group)) : null;
  const footerColumns = (currentGrouping.compiledFooterColumns) ? currentGrouping.compiledFooterColumns.map(render => render(group)) : null;

  const headerContext = {
    lineClass: "report-group-header",
    detail: renderGroupHeaderDetail(group),
    columns: renderColumns(headerColumns, group.groupLevel)
  };
  const footerContext = {
    lineClass: "report-group-footer",
    detail: renderGroupFooterDetail(group),
    columns: renderColumns(footerColumns, group.groupLevel)
  };


  let content;
  if (group.groups) {
    content = (group.groupOrder || Object.keys(groups))
      .map(key => buildGroup(group.groups[key], def))
      .join('\n');
  } else {
    content = renderItems(group.items, def.compiledItemDetail, def.compiledItemColumns);
  }
  const groupHeader = (currentGrouping.groupHeader) ? renderLine(headerContext) : '';
  const groupFooter = (currentGrouping.groupFooter) ? renderLine(footerContext) : '';
  // const content = (group.groups)
  //   ? buildGroups(group.groups, def)
  //   : renderItems(group.items, def.detail, def.renderColumns);

  return renderGroup({groupHeader, groupFooter, content, groupLevel: group.groupLevel});
}


function renderItems(items, compiledItemDetail, compiledColumnDetails, groupLevel) {

  return items
    .map(item => {
      const columns = compiledColumnDetails.map(render => render(item));
      const context = {
        lineClass: 'report-item',
        detail: compiledItemDetail(item),
        columns: renderColumns(columns, groupLevel)
      }
      return renderLine(context);
    })
    .join('\n');
}
