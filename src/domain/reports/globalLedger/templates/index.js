import html from './html';
import csv from './csv';

const _templates = { html, csv };

export default {
  getTemplate: function(format) {
    const template = _templates[format];
    if (!template) throw new Error(`Unknown format for Global Ledger: '${format}'`);

    return template;
  }
}
