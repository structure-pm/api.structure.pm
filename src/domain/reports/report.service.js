import handleBars from 'handlebars';

export function renderReport(def, data) {
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
function groupBy( col , selector ) {
  const groups = {};
  if (typeof selector === 'string') {
    selector = item => item[selector];
  }

  col.forEach( item => {
    var group = JSON.stringify( selector(item) );
    groups[group] = groups[group] || [];
    groups[group].push( item );
  });

  return Object
    .keys(groups)
    .map( group => ({key: group, items: groups[group]}) );
}




function renderGroup(group, def) {
  const groupHeader = handlebars.compile(group.groupHeader || '');
  const groupFooter = handlebars.compile(group.groupFooter || '');

  let html = groupHeader(group);

  if (!group.groupBy) {
    // TODO: Sort the items
    html += renderItems(group.items, def.detail);
  } else {
    const groups = groupBy(group.items, group.groupBy.field)
      .map(group => Object.assign(group, group.groupBy));

    // TODO: Sort the groups

    html += groups.reduce((html, group) => {
      html += renderGroup(group, def);
      return html;
    });
  }

  html += groupFooter(group);
  return html;
}

function renderItems(items, template) {
  return items.reduce((html, item) => {
    html += handlebars.compile(template)(item);
    return html;
  }, '');
}
