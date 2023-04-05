module.exports = (info = {}) => {
  const widths = ['*', 70, 70, 40, 50, 80];

  const table = [
    [
      { text: 'Virtual Assistant', bold: true, margin: [0, 0, 0, 5] },
      { text: 'Start date', bold: true, margin: [0, 0, 0, 5] },
      { text: 'End date', bold: true, margin: [0, 0, 0, 5] },
      { text: 'Hours', bold: true, alignment: 'right', margin: [0, 0, 0, 5] },
      { text: 'Rate', bold: true, alignment: 'right', margin: [0, 0, 0, 5] },
      { text: 'Amount', bold: true, alignment: 'right', margin: [0, 0, 0, 5] },
    ],
  ];

  info?.details?.forEach?.((d) => {
    table.push([
      { text: d.name, margin: [0, 5, 0, 5] },
      { text: d.startDate, margin: [0, 5, 0, 5] },
      { text: d.endDate, margin: [0, 5, 0, 5] },
      { text: d.hours, margin: [0, 5, 0, 5], alignment: 'right' },
      { text: d.rate, margin: [0, 5, 0, 5], style: { alignment: 'right' } },
      { text: d.amount, margin: [0, 5, 0, 5], style: { alignment: 'right' } },
    ]);
  });

  return {
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
  };
};
