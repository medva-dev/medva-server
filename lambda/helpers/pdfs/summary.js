module.exports = (info = {}) => {
  return {
    layout: {
      hLineWidth: function (i, node) {
        return i === 0 ? 0.3 : 0;
      },
      vLineWidth: function (i, node) {
        return 0;
      },
      hLineColor: function (i, node) {
        return '#e1e1e1';
      },
    },
    margin: [0, 10],
    table: {
      widths: ['*'],
      body: [
        [
          {
            layout: 'noBorders',
            margin: [0, 8],
            table: {
              widths: ['50%', '50%'],
              body: [
                [
                  {
                    layout: 'noBorders',
                    table: {
                      widths: ['*'],
                      body: [
                        [{ text: 'Bill to:', color: '#707070' }],
                        [{ text: info.companyName, bold: true }],
                        ...(info?.companyAddress?.map?.((address) => {
                          return [
                            {
                              text: address,
                              margin: [0, -3, 0, 0],
                              style: { fontSize: 10 },
                            },
                          ];
                        }) ?? []),
                      ],
                    },
                  },
                  {
                    layout: 'noBorders',
                    table: {
                      widths: [20, 75, 1, '*'],
                      body: [
                        [
                          {
                            text: '',
                          },
                          {
                            text: 'Invoice #',
                            style: { color: '#707070' },
                          },
                          {
                            text: ':',
                          },
                          {
                            text: info.id,
                            style: { alignment: 'right', bold: true },
                          },
                        ],
                        [
                          {
                            text: '',
                          },
                          {
                            text: 'Invoice Date',
                            style: { color: '#707070' },
                          },
                          {
                            text: ':',
                          },
                          {
                            text: info.date,
                            style: { alignment: 'right', bold: true },
                          },
                        ],
                        [
                          {
                            text: '',
                          },
                          {
                            text: 'Due Date',
                            style: { color: '#707070' },
                          },
                          {
                            text: ':',
                          },
                          {
                            text: info.dueDate,
                            style: { alignment: 'right', bold: true },
                          },
                        ],
                        [
                          {
                            text: '',
                            margin: [0, 10, 0, 0],
                          },
                          {
                            text: 'Amount due',
                            style: { color: '#707070' },
                            margin: [0, 10, 0, 0],
                          },
                          {
                            text: ':',
                            margin: [0, 10, 0, 0],
                          },
                          {
                            text: info.total?.amount,
                            style: {
                              alignment: 'right',
                              bold: true,
                              color: '#293893',
                            },
                            margin: [0, 10, 0, 0],
                          },
                        ],
                      ],
                    },
                  },
                ],
              ],
            },
          },
        ],
      ], // end of main body
    },
  };
};
