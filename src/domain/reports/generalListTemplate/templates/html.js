export const report = `
  <style>
    {{{style}}}
  </style>
  <div class="report-wrapper">
    <header class="report-header">
      {{{ header }}}
    </header>
    <article class="report-content">
      {{{content}}}
    </article>
    <footer class="report-footer">
      {{{ footer }}}
    </footer>
  </div>`;
export const reportHeader = `
  <div class="report-title">
    <h1>{{ reportTitle }}</h1>
    <h2>{{ reportFor }}</h2>
  </div>`;
export const group = `
  {{#if groupHeader}} {{{groupHeader}}} {{/if}}
  <ul class="report-group group-level-{{level}}">
    {{{content}}}
  </ul>
  {{#if groupFooter}} {{{groupFooter}}} {{/if}}
`;
export const line = `
  <li class="report-line {{lineType}} level-{{level}}">
    <div class="report-line-detail">
      {{{detail}}}
    </div>
    <div class="report-line-columns">
      {{#each columns}}
        {{{this}}}
      {{/each}}
    </div>
  </li>`;


export const column = `
  <div class="report-line-column">
    {{this}}
  </div>
`;
