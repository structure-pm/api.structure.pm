import handlebars from 'handlebars';


export default function Column(name, field, columnIndex, format) {
  this.name = name;
  this.field = field;
  this.columnIndex = columnIndex;
  this.format = format || "{{value}}";
  this.compiledFormat = handlebars.compile(this.format);
}

Column.prototype.formatValue = function(value) {
  return this.compiledFormat({value, columnIndex: this.columnIndex});
}
