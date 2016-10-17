import path from 'path';
import sass from 'node-sass';
import engine from '../../engine'

const styleFile = path.join(__dirname, 'style.scss');
const style = sass.renderSync({ file: styleFile }).css.toString('utf8');


export default function render(lines, report) {
  const itemLine = engine.compile(lineTemplate);
  const groupHeader = engine.compile(groupHeaderTemplate);
  const groupFooter = engine.compile(groupFooterTemplate);
  const reportHeader = engine.compile(reportHeaderTemplate);
  const reportFooter = engine.compile(reportFooterTemplate);
  const renderReport = engine.compile(reportTemplate);

  const header = reportHeader(report);
  const footer = reportFooter(report);


  const columnCount = lines[0].columns.length;
  // console.log(lines.map(l => l.detail));


  return renderReport({ style, header, footer, lines, columnCount });
}

export const reportTemplate = `
  <style>
    {{{style}}}
  </style>
  <div class="report-wrapper">
    <header class="report-header">
      {{{ header }}}
    </header>
    <article class="report-content">
      {{#each lines}}
      <div class="report-line {{lineType}} level-{{level}}">
        <div class="report-line-detail {{lineType}} level-{{level}}">
        {{{safeVal detail '&nbsp;'}}}
        </div>
        <div class="report-line-columns {{lineType}} level-{{level}} columns-{{columnCount}}">
          {{#each columns}}
            <div class="report-line-column">
              {{{this}}}
            </div>
          {{ else }}
            &nbsp;
          {{/each}}
        </div>
      </div>
      {{/each}}
    </article>
    <footer class="report-footer">
      {{{ footer }}}
    </footer>
  </div>`;
export const reportHeaderTemplate = `
  <div class="report-title">
    <h1>{{ reportTitle }}</h1>
    <h2>{{ reportFor }}</h2>
  </div>`;

export const reportFooterTemplate = '';

export const groupHeaderTemplate = `
  {{#if groupHeader}} ${lineTemplate} {{/if}}
`;
// <div class="report-group group-level-{{level}}">
// </div>
export const groupFooterTemplate = `
  {{#if groupFooter}} ${lineTemplate} {{/if}}
`
export const group = `
  {{#if groupHeader}} {{{groupHeader}}} {{/if}}
  <div class="report-group group-level-{{level}}">
    {{{content}}}
  </div>
  {{#if groupFooter}} {{{groupFooter}}} {{/if}}
`;
export const lineTemplate = `
  <div class="report-line {{lineType}} level-{{level}}">
    <div class="report-line-detail">
      {{{detail}}}
    </div>
    {{#each columns}}
      <div class="report-line-column">
        {{{this}}}
      </div>
    {{/each}}
  </div>`;
  // </div>
  // <div class="report-line-columns">
