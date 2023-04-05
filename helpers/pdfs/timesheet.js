module.exports = ({ array = [], total = 0 }) => {
  const widths = ['*', 70, 40, 50, 80];

  const table = [
    [
      { text: 'Virtual Assistant', bold: true, margin: [0, 0, 0, 5] },
      { text: 'Date', bold: true, margin: [0, 0, 0, 5] },
      { text: 'Hours', bold: true, alignment: 'right', margin: [0, 0, 0, 5] },
      { text: 'Rate', bold: true, alignment: 'right', margin: [0, 0, 0, 5] },
      { text: 'Amount', bold: true, alignment: 'right', margin: [0, 0, 0, 5] },
    ],
  ];

  array?.forEach?.((d) => {
    table.push([
      { text: d.name, margin: [0, 5, 0, 5] },
      { text: d.date, margin: [0, 5, 0, 5] },
      { text: d.hours, margin: [0, 5, 0, 5], alignment: 'right' },
      { text: d.rate, margin: [0, 5, 0, 5], alignment: 'right' },
      { text: d.total, margin: [0, 5, 0, 5], alignment: 'right', bold: true },
    ]);
  });

  return [
    {
      margin: [0, 20],
      layout: {
        hLineWidth: function (i, node) {
          return i === 0 || i === node.table.body.length ? 0 : 0.3;
        },
        vLineWidth: function (i, node) {
          return 0;
        },
        hLineColor: function (i, node) {
          return '#e1e1e1';
        },
      },
      table: {
        widths,
        body: table,
      },
    },
    {
      layout: 'noBorders',
      margin: [0, 20, 5],
      table: {
        widths: ['50%', '50%'],
        body: [
          [
            { text: '' },
            {
              layout: 'noBorders',
              margin: [0, 10],
              table: {
                widths: ['*', 80],
                body: [
                  [
                    {
                      text: 'Total amount',
                      style: { color: '#707070', alignment: 'right' },
                    },
                    {
                      text: total,
                      bold: true,
                      style: { alignment: 'right' },
                    },
                  ],
                ],
              },
            },
          ],
        ],
      },
    },
  ];
};
