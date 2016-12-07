import html from './html';

const _templates = { html };

export default {
  getTemplate: function(format) {
    const template = _templates[format];
    if (!template) throw new Error(`Unknown format for Global Ledger: '${format}'`);

    return template;
  }
}
