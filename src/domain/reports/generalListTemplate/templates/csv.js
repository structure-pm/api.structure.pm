import engine from '../../engine'

export default function render(lines, report) {
  const reportHeader = engine.compile(reportHeaderTemplate);
  const reportFooter = engine.compile(reportFooterTemplate);
  const renderReport = engine.compile(reportTemplate);

  const header = reportHeader(report);
  const footer = reportFooter(report);

  return renderReport({ header, footer, lines });

}

export const lineTemplate = `{{csvEmpty level}}"{{{detail}}}",{{csvEmpty maxLevel minus=level}}{{#each columns}}"{{{this}}}",{{/each}}`;
export const reportTemplate = `{{{header}}}
{{#each lines}}${lineTemplate}\n{{/each}}
{{{footer}}}`;
export const reportHeaderTemplate = `{{reportTitle}}\n{{reportFor}}\n\n`;
export const reportFooterTemplate = ``;

export const group = `{{#if groupHeader}}{{{groupHeader}}}\n{{/if}}{{{content}}}
{{#if groupFooter}}{{{groupFooter}}}{{/if}}`;
export const column = `{{{this}}}`;
