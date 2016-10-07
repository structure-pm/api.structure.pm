import path from 'path';
import Promise from 'bluebird';
import handlebars from 'handlebars';
import registerHelpers from './helpers'
import style from './style';
import sass from 'node-sass';
import * as htmlTemplates from './templates/html';



const styleFile = path.join(__dirname, 'style.scss');
const styleResults = sass.renderSync({
  file: styleFile
});
const STYLE = styleResults.css.toString('utf8')

registerHelpers(handlebars);


export default function renderGeneralListReport(options, items, format="html") {

  const report = Object.assign({}, options, {items});
  const templates = compileObj(htmlTemplates); // TODO: make this dependent on format


  // Compile the headers and footers for each grouping
  report.groupings = compileGroupTemplates(options.groupBy);

  // Compile templates related to data times
  report.compiledItemDetail = handlebars.compile(options.detail);
  report.compiledItemColumns = compileArray(options.columns);

  // Recursively group and sort data
  report.root = {
    level: 0,
    groups: applyGroupBy(report.groupings, report.items)
  }


  const reportHeader = handlebars.compile(report.reportHeader || '');
  const reportFooter = handlebars.compile(report.reportFooter || '');

  const html = templates.report({
    header: reportHeader(report),
    footer: reportFooter(report),
    content: renderGroup(report.root, report, templates),
    style: STYLE
  });

  return html;


}







export function getAggregates(group, agg) {
  agg = agg || {};
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


/**
 * Recursively groups data according to the rules of each groupings
 *
 * Will use the first grouping rule in the groupings array and pass
 * the remaining rules to the next iteration.
 *
 * If groupings is null or zero-length, null is returned.
 *
 * @param  {Array} groupings List of grouping rules
 * @param  {Collection} data      Data to be grouped
 * @param  {Number} level=1   Depth of the current grouping
 * @return {Array}           Array of nested groups
 */
export function applyGroupBy(groupings, data, level=0) {
  if (!groupings || !groupings.length) return null;
  if (!Array.isArray(groupings)) groupings = [groupings];

  const currentGrouping = groupings[0];
  const nextGroupings = groupings.slice(1);

  const groups = groupBy(data, currentGrouping.selector);
  groups.sort(groupSorter(currentGrouping.sortBy));

  return groupBy(data, currentGrouping.selector)
    .sort(groupSorter(currentGrouping.sortBy))
    .map(group => Object.assign(group, {
      level: level,
      grouping: currentGrouping,
      aggregates: getAggregates(group, currentGrouping.aggregates),
      groups: applyGroupBy(nextGroupings, group.items, level+1)
    }));
}

/**
 * Group a collection of objects based on the selector function
 *
 * If no selector is passed, all items will be grouped together
 * and the key for the group will be 'all';
 *
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

  if (!selector) {
    selector = item => 'all';
  }

  if (typeof selector === 'string') {
    const field = selector;
    selector = item => item[field];
  }

  items.forEach( item => {
    var groupKey = selector(item);
    itemGroups[groupKey] = itemGroups[groupKey] || [];
    itemGroups[groupKey].push( item );
  });

  return Object
    .keys(itemGroups)
    .map( key => ({
      key: key,
      items: itemGroups[key]
    }));
}

// =============================================================================
// ==== GROUP SORTING
// =============================================================================
function sortAscending(a, b) {
  if (a.key>b.key) return 1;
  else if (a.key<b.key) return -1;
  else return 0;
}

function sortDescending(a,b) {
  return -1 * sortAscending(a,b);
}

function sortByArray(ary) {
  return function(a, b) {
    return ary.indexOf(a.key) - ary.indexOf(b.key);
  }
}

function groupSorter(sortBy) {
  if (!sortBy) {
    return (a,b) => 1;
  } else if (sortBy.toLowerCase() === 'asc') {
    return sortAscending;
  } else if (sortBy.toLowerCase() === 'desc') {
    return sortDescending;
  } else if (typeof sortBy === 'function' ) {
    return sortBy;
  } else if (Array.isArray(sortBy)) {
    return sortAry(sortBy);
  }
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



// =============================================================================
// ==== RENDERING
// =============================================================================

function renderGroup(group, report, templates) {
  const currentGrouping = group.grouping || {};
  let groupHeader;
  if (currentGrouping.header) {
    // Columns:
    // group.value -> formatted value -> column-wrapped value
    const compiledDetail = currentGrouping.header.compiledDetail; // TODO: this space reserved for override
    const compiledColumns = currentGrouping.header.compiledColumns || [];
    const formattedValues = compiledColumns.map(render => render(group))
    const headerContext = {
      lineType: "group-header",
      level: group.level,
      detail: compiledDetail(group),
      columns: formattedValues.map(val => templates.column(val))
    };
    groupHeader = templates.line(headerContext);
  }

  let groupFooter;
  if (currentGrouping.footer) {
    const compiledDetail = currentGrouping.footer.compiledDetail;
    const compiledColumns = currentGrouping.footer.compiledColumns || [];
    const formattedValues = compiledColumns.map(render => render(group))
    const footerContext = {
      lineType: "group-footer",
      level: group.level,
      detail: compiledDetail(group),
      columns: formattedValues.map(val => templates.column(val))
      // columns: renderColumns(headerColumns, group.groupLevel)
    };
    groupFooter = templates.line(footerContext);
  }

  const content = (group.groups)
    ? group.groups
      .map(group => renderGroup(group, report, templates))
      .join('\n')
    : renderItems(group.items, report, templates, group.level);

  return templates.group({groupHeader, groupFooter, content, level: group.level});
}


function renderItems(items, report, templates, level) {
  const compiledItemDetail = report.compiledItemDetail;
  const compiledItemColumns = report.compiledItemColumns;



  return items
    .map(item => {
      const columns = compiledItemColumns.map(render => render(item));
      const context = {
        lineType: 'item',
        level: level,
        detail: compiledItemDetail(item),
        columns: renderItemColumns(item, report, templates)
      }
      return templates.line(context);
    })
    .join('\n');
}

/**
 * Create the rendered columns to insert in to the report line
 *
 * item.value -> formatted value -> column-wrapped value
 *
 * @param  {Object} item      Item to be rendered
 * @param  {Object} report    Report definition
 * @param  {Object} templates Compiled templates for the report format
 * @return {Array}           Array of strings
 */
function renderItemColumns(item, report, templates) {
  const formattedValues = report.compiledItemColumns.map(render => render(item));
  return formattedValues.map(val => templates.column(val))
}



// =============================================================================
// ==== COMPILE FUNCTIONS
// =============================================================================
/**
 * Applies common fields to all groupings
 */
export function compileGroupTemplates(groupings) {
  if (!groupings) return groupings;

  return groupings.map(grouping => {
    if (grouping.header) {
      Object.assign(grouping.header, {
        compiledDetail: handlebars.compile(grouping.header.detail),
        compiledColumns: compileArray(grouping.header.columns)
      });
    }

    if (grouping.footer) {
      Object.assign(grouping.footer, {
        compiledDetail: handlebars.compile(grouping.footer.detail),
        compiledColumns: compileArray(grouping.footer.columns)
      });
    }
    return grouping;
  });
}

/**
 * Compiles an array of templates
 *
 * Ensures that the passed columns are part of an array
 *
 * @param  {Array|Any} columns
 * @return {Array}         Array of comile functions
 */
export function compileArray(columns) {
  if (!columns) return null;
  if (!Array.isArray(columns)) columns = [columns];
  return columns.map(col => handlebars.compile(col));
}

/**
 * Compile a bunch of handlebars templates
 *
 * Accepts an object where the properties are handlebars templates and
 * returns a new object of compiled templates.  The keys for the compiled
 * object have the form
 * 	template.key => compiled.compiledKey
 *
 * If the template property is not a string, it is skipped.
 *
 * @param  {Object} obj
 * @return {Object}
 */
function compileObj(obj) {
  return Object.keys(obj).reduce((compiled, key) => {
    if (typeof obj[key] !== 'string') return compiled;

    // const capKey = key.charAt(0).toUpperCase() + key.slice(1);
    // const compiledKey = `compiled${capKey}`;
    const compiledKey = key;
    compiled[compiledKey] = handlebars.compile(obj[key]);
    return compiled;
  }, {});
}
