import handlebars from 'handlebars';

export function render(reportName, reportFormat, options, data) {
  reportName = 'general'; // this is the only report supported at this time
  reportFormat = 'html'; // this is the only format supported at this time

  return renderGeneralReport(options, data);
}

function renderGeneralReport(def, data) {
  const report = Object.assign({}, def, {items: data});

  const reportHeader = handlebars.compile(report.reportHeader || '');
  const reportFooter = handlebars.compile(report.reportFooter || '');

  let html = reportHeader(report);
  html += renderGroup(report, report);
  html += reportFooter(report);
  return html;
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
function groupBy( items , selector ) {
  const groups = {};
  if (typeof selector === 'string') {
    const field = selector;
    selector = item => item[field];
  }


  items.forEach( item => {
    var groupKey = JSON.stringify( selector(item) );
    groups[groupKey] = groups[groupKey] || [];
    groups[groupKey].push( item );
  });

  return Object.keys(groups).map( groupKey => ({
    key: groupKey,
    items: groups[groupKey]
  }) );
}




function renderGroup(group, def) {
  let html = '';


  if (group.groupHeader) {
    const groupHeader = handlebars.compile(group.groupHeader || '');
    html += "<li>" + groupHeader(group) + "</li>";
  }

  html += "<ul>";

  if (!group.groupBy) {
    // TODO: Sort the items
    html += renderItems(group.items, def.detail);
  } else {
    const groups = groupBy(group.items, group.groupBy.field)
      .map(subGroup => Object.assign(subGroup, group.groupBy));

    // TODO: Sort the groups

    html += groups.reduce((html, group) => {
      html += renderGroup(group, def);
      return html;
    },'');
  }

  html += "</ul>";

  if (group.groupFooter) {
    const groupFooter = handlebars.compile(group.groupFooter || '');
    html += "<li>" + groupFooter(group) + "</li>";
  }
  return html;
}

function renderItems(items, template) {
  return items.reduce((html, item) => {
    html += "<li>";
    html += handlebars.compile(template)(item);
    html += "</li>";
    return html;
  }, '');
}
