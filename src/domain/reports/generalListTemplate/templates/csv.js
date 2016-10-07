export const report = `{{{header}}}
{{{content}}}
{{{footer}}}`;
export const reportHeader = `{{reportTitle}}\n{{reportFor}}\n\n`;
export const group = `{{#if groupHeader}}{{{groupHeader}}}\n{{/if}}{{{content}}}
{{#if groupFooter}}{{{groupFooter}}}{{/if}}`;
export const line = `{{csvEmpty level}}"{{{detail}}}",{{csvEmpty maxLevel minus=level}}{{#each columns}}"{{{this}}}"{{/each}}`;
export const column = `{{{this}}}`;
