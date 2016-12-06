import engine from '../engine'
import {tableTemplate, headerTemplate, lineTemplate, bodyTemplate} from './templates';

engine.registerPartial('ledgerLine', lineTemplate);
const renderTable = engine.compile(tableTemplate);
const renderHeader = engine.compile(headerTemplate);
const renderBody = engine.compile(bodyTemplate);


function GlobalLedger(parameters, configuration, dataset, format) {
  this.parameters = paramters;
  this.configuration = configuration;
  this.dataset = dataset;
  this.format = format;
}

GlobalLedger.prototype.render = function() {
  const {data} = this.dataset;

  const header = renderHeader();
  const body = renderBody({lines: data});
  const table = renderTable({body, header});

  return table;
}
