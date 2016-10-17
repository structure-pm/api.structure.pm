import groupSorter from './groupSorter';
import engine from '../engine';

export default function Group(key, items, columns, options) {
  this.key = key;
  this.items = items;
  this.columns = columns;
  this.columnHeaders = options.columnHeaders

  this.level = options.level || 0;
  this.sortBy = options.sortBy;
  this.header = options.header;
  this.footer = options.footer;
  this.aggregatesRequested = options.aggregates;
  this.groupings = options.groupings;


  this.groups = applyGroupings.call(this, options.groupings);
  this.aggregates = getAggregates.call(this, columns, this.aggregatesRequested);


  this.containedLevels = (this.groups && this.groups.length)
    ? Math.max.apply(null, this.groups.map(g => g.containedLevels)) + 1
    : 1 // The group contains, at least, some items
}

Group.prototype.getHeaderDetail = function() {
  return getDetail.call(this, 'header');
}
Group.prototype.getFooterDetail = function() {
  return getDetail.call(this, 'footer');
}

Group.prototype.getHeaderColumns = function() {
  const columnAggregate = (this.header || {}).columns;
  return getFormattedColumnValues.call(this, columnAggregate, this.columns);
}
Group.prototype.getFooterColumns = function() {
  const columnAggregate = (this.footer || {}).columns;
  return getFormattedColumnValues.call(this, columnAggregate, this.columns);
}

function getDetail(hf) {
  if (!this[hf] || !this[hf].detail) return null;
  return engine.renderTemplate(this[hf].detail, this);
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
Group.groupBy = function( items , selector ) {
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

export function getAggregates(columns, agg) {
  const group = this;
  agg = agg || {};

  return columns.map(col => {

    return Object.keys(agg).reduce((aggregates, aggType) => {
      switch (aggType) {
        case 'sum':
          aggregates.sum = group.items.reduce((sum, item) => sum + item[col.field],0);
          break
        // TODO: max, min, mean
        default:
          const script = engine.renderTemplate(agg[aggType], {group, currentColumn: col.columnIndex});
          aggregates[aggType] = engine.sandboxEval(script);
      }
      return aggregates;
    }, {})
  })
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
export function applyGroupings(groupings) {
  if (!groupings || !groupings.length) return undefined;

  const currentGrouping = groupings[0];
  const nextGroupings = groupings.slice(1);

  return Group.groupBy(this.items, currentGrouping.selector)
    .sort(groupSorter(this.sortBy))
    .map(group => {
      return new Group(group.key, group.items, this.columns, {
        level: this.level + 1,
        header: currentGrouping.header,
        footer: currentGrouping.footer,
        sortBy: currentGrouping.sortBy,
        aggregates: currentGrouping.aggregates,
        groupings: nextGroupings,
      });
    });
}


/**
 * The user can specify which aggregate to use via the setting
 *  `groupBy[grouping].{header|footer}.columns`: (string)
 *  This will search the group's `aggregates` collection for the
 *  appropriate property
 */
function getFormattedColumnValues(columnAggregate, columns) {
  if (!columnAggregate) return [];
  const group = this;
  return columns.map((col, idx) => {
    const value = (group.aggregates[idx].hasOwnProperty(columnAggregate))
      ? group.aggregates[idx][columnAggregate]
      : `?${columnAggregate}`;
    return col.formatValue(value);
  })
}
