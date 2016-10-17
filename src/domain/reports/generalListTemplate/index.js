import Promise from 'bluebird';
import handlebars from 'handlebars';
import engine from '../engine'
import registerHelpers from './helpers'
import Column from './column';
import Group from './group';

import renderHTML from './templates/html';
import renderCSV from './templates/csv';

registerHelpers(engine.handlebars);

const templateSets = {
  html: renderHTML,
  csv : renderCSV,
};





export default function GeneralListTemplate(options, dataset, format="html") {
  Object.assign(this, options);
  this.format = format;
  this.items = dataset.data || options.data;
  this.renderReport = templateSets[format];
  this.groupings = options.groupBy;

  // Create a columns definition collection
  this.columns = dataset.partitions.map((part, idx) => new Column(part.name, part.field, idx, options.columnDetail));
  // Compile templates related to data times
  this.formatItemDetail = engine.compile(options.detail);


  if (!this.items) throw new Error("Missing data from dataset");
  if (!this.columns) throw new Error("Missing dataset partitions setting");
  if (!this.renderReport) throw new Error(`Unknown report format: ${format}`);

}

GeneralListTemplate.prototype.render = function()  {

  // Recursively group and sort data
  this.root = new Group('root', this.items, this.columns, {
    groupings: this.groupings,
  })


  const reportContext = {
    maxLevel: this.root.containedLevels,
  };

  const columnHeaderLine = Object.assign({
    lineType: 'column-header',
    level: 0,
    detail: null,
    columns:this.columns.map(col => col.name)
  }, reportContext);

  const reportLines = buildGroup.call(this, this.root, reportContext);
  const allLines = [].concat(columnHeaderLine, reportLines);

  return this.renderReport(allLines, this);
}






// =============================================================================
// ==== RENDERING
// =============================================================================

/**
 * Returns an array of lines
 * @param  {[type]} group         [description]
 * @param  {[type]} reportContext [description]
 * @return {[type]}               [description]
 */
function buildGroup(group, reportContext) {
  const report = this;

  const groupContext = Object.assign({level: group.level}, reportContext);

  const headerDetail = group.getHeaderDetail();
  const headerColumns = group.getHeaderColumns();
  const groupHeader = Object.assign({}, {
    lineType: "group-header",
    detail: headerDetail,
    columns: headerColumns,
    noRender: !headerDetail && !headerColumns
  }, groupContext);

  const footerDetail = group.getFooterDetail();
  const footerColumns = group.getFooterColumns();
  const groupFooter = Object.assign({}, {
    lineType: "group-footer",
    detail: footerDetail,
    columns: footerColumns,
    noRender: !footerDetail && !footerColumns
  }, groupContext);


  const lineContext = Object.assign({level: group.level + 1}, reportContext);
  const content = (group.groups)
    ? group.groups
        .map(subGroup => buildGroup.call(report, subGroup, reportContext))
        .reduce((lines, subGroup) => lines.concat(subGroup), [])
    : group.items
        .map(item => buildItem.call(report, item, lineContext))

  return [].concat(groupHeader, content, groupFooter)
}


function buildItem(item, groupContext) {
  return Object.assign({
    lineType: 'item',
    detail: this.formatItemDetail(item),
    columns: getItemColumns(item, this.columns),
  }, groupContext);
}

function getItemColumns(item, columns) {
  return columns.map(col => {
    const value = (item.hasOwnProperty(col.field)) ? item[col.field] : `?${col.field}`;
    return col.formatValue(value);
  })

}
