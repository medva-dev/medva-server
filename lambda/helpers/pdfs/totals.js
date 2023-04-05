const divider = require('./divider');

module.exports = (info = {}) => {
  const totals = [];

  info?.extras?.forEach?.((d) => {
    totals.push([
      {
        text: d.label,
        style: { color: '#707070', alignment: 'right' },
      },
      {
        text: d.amount,
        style: { alignment: 'right' },
      },
    ]);
  });

  totals.push([
    {
      text: info.total?.label,
      margin: [0, 15],
      style: { alignment: 'right', color: '#293893' },
    },
    {
      text: info.total?.amount,
      margin: [0, 15],
      style: { alignment: 'right', bold: true, color: '#293893' },
    },
  ]);

  return {
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
              body: totals,
            },
          },
        ],
        [
          {
            text: 'To pay online, please click the link below:',
            color: '#707070',
            margin: [0, 20],
          },
          '',
        ],
        [
          {
            margin: [0, -20],
            text: 'https://payments.medva.com/sample-link',
            color: '#293893',
            link: 'https://payments.medva.com/sample-link',
          },
          '',
        ],
      ],
    },
  };
};
