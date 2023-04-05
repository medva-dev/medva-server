const path = require('path');
const logo = path.join(__dirname, '../logo.png');

module.exports = (title = 'INVOICE') => {
  return {
    layout: 'noBorders',
    table: {
      widths: ['50%', '50%'],
      body: [
        [
          {
            layout: 'noBorders',
            table: {
              widths: '*',
              body: [
                [
                  {
                    text: 'MEDVA LLC',
                    margin: [0, 0, 0, 0],
                    bold: true,
                    color: '#293893',
                    style: { fontSize: 14 },
                  },
                ],
                [
                  {
                    text: '440 N BARRANCA AVE #1122',
                    margin: [0, -3, 0, 0],
                    style: { fontSize: 10, color: '#707070' },
                  },
                ],
                [
                  {
                    text: 'COVINA, CA 91723 PH',
                    margin: [0, -3, 0, 0],
                    style: { fontSize: 10, color: '#707070' },
                  },
                ],
                [
                  {
                    text: '+1 3102278780',
                    margin: [0, -3, 0, 0],
                    style: { fontSize: 10, color: '#707070' },
                  },
                ],
                [
                  {
                    text: 'finance@medva.com',
                    margin: [0, -3, 0, 0],
                    style: { fontSize: 10, color: '#707070' },
                  },
                ],
                [
                  {
                    text: 'https://medva.com/',
                    margin: [0, -3, 0, 0],
                    color: '#293893',
                    link: 'https://medva.com/',
                    style: { fontSize: 10 },
                  },
                ],
              ],
            },
          },
          {
            layout: 'noBorders',
            table: {
              widths: ['*'],
              body: [
                [
                  {
                    layout: 'noBorders',
                    table: {
                      widths: ['*'],
                      body: [
                        [
                          {
                            image: logo,
                            width: 150,
                            style: { alignment: 'right' },
                          },
                        ],
                        [
                          {
                            text: title,
                            margin: [0, 15, 0, 0],
                            style: {
                              bold: true,
                              alignment: 'right',
                              fontSize: 30,
                              opacity: 0.2,
                            },
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
      ],
      // end of main body
    },
  };
};
