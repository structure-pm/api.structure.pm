// reports/generalTableTemplate/index.js
import templates from './templates';

export default function GeneralTable(parameters, configuration, dataset, format) {
  this.parameters = parameters;
  this.configuration = configuration;
  this.dataset = dataset;
  this.format = format;

  this.template = templates.getTemplate(this.format);
}

GeneralTable.prototype.render = function() {
  const {data} = this.dataset;
  const {template} = this;
  const {headers} = this.configuration;

  if (!headers) {
    throw new Error(`GeneralTable template requires a missing 'headers' parameter in the report configuration`)
  }

  return template.render(data, headers);
}
