// reports/assetManager/index.js
import templates from './templates';

export default function AssetManager(parameters, configuration, dataset, format) {
  this.parameters = parameters;
  this.configuration = configuration;
  this.dataset = dataset;
  this.format = format;

  this.template = templates.getTemplate(this.format);
}

AssetManager.prototype.render = function() {
  const {data} = this.dataset;
  const {template} = this;

  return template.render(data);
}
