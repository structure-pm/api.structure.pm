export default function(api) {
  api.add({
    ".report-wrapper": {
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      backgroundColor: '#fff',
      color: '#000 !important',
      padding: '10px',

      "header.report-header": {
        borderBottom: '2px solid #000',
        marginBottom: '10px',

        ".report-title": {
          textAlign:'center'
        }
      },

      li: {
        listStyle: 'none'
      },

      "li.report-line": {
        "display": "flex",
        "flex-flow": "row nowrap",

        ".report-line-detail": {
          flexGrow: 1,
        },
        ".report-line-column": {
          flexGrow: 0
        },

      },

      ".report-group": {
        marginBottom: '10px',
      },

      ".report-group-footer": {
        marginTop: '10px'
      },

      ".report-group-footer .report-line-columns.group-level-1 ": {
        borderBottom: "double black 5px"
      },

      ".total": {
        borderTop: '1px solid #000'
      }

    }
  })
}
