import templates from './templates';

export default function GlobalLedger(parameters, configuration, dataset, format) {
  this.parameters = parameters;
  this.configuration = configuration;
  this.dataset = dataset;
  this.format = format;

  this.template = templates.getTemplate(this.format);
}

GlobalLedger.prototype.render = function() {
  const {data} = this.dataset;
  const {template} = this;

  return template.render(data);
}
