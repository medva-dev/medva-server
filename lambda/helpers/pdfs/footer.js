const divider = require('./divider');

module.exports = (info = {}) => {
  return {
    layout: 'noBorders',
    margin: [0, 200, 5],
    table: {
      widths: ['*'],
      body: [[{ text: 'hehe' }]],
    },
  };
};
