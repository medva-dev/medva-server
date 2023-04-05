const path = require('path');
const nodemailer = require('nodemailer');

const functions = {};

functions.sendMail = async (details = {}) => {
  const mailOptions = {
    from: `${details.senderName} <${details.senderEmail}>`,
    subject: details.subject,
    html: details.message,
    to: details.recipient,
    attachments: details.attachments || [],
    replyTo: details.replyTo || details.senderName,
  };

  const transporter = nodemailer.createTransport({
    host: 'smtpout.secureserver.net',
    port: '465',
    auth: { user: 'sales@tpz.services', pass: 'Loslos123#' },
    secureConnection: false,
    tls: { ciphers: 'SSLv3' },
  });

  const response = await transporter.sendMail(mailOptions);
  return response;
};

const subject = (name) => `Appointment: ${name}`;

const html = (id, password, link) => {
  return `
      <br>
      <br>
      <h3>You are invited to a scheduled Zoom meeting</h3>
      Join Zoom Meeting:
      <br>
      <a href="${link}">${link}</a>
      <br>
      <br>
      <b>Meeting ID:</b> ${id}
      <br/>
      <b>Passcode:</b> ${password}
      <br>
      <br/><br/>
      See you,
      <br>
      <img src="cid:logo"  width="150">
      <br>
      <br>
      <br>
      <br>
      `;
};

functions.sendInvitations = async ({
  zoomId,
  zoomPassword,
  zoomLink,
  clientEmail,
  virtualAssistantEmail,
  clientName,
}) => {
  if (!zoomId) {
    throw new Error(`No Zoom ID`);
  }

  if (!zoomPassword) {
    throw new Error(`No Zoom Password`);
  }

  if (!zoomLink) {
    throw new Error(`No Zoom Link`);
  }

  const recipient = [];

  if (clientEmail) {
    recipient.push(clientEmail);
  }

  if (virtualAssistantEmail) {
    recipient.push(virtualAssistantEmail);
  }

  if (recipient.length < 1) {
    throw new Error('No recipient found');
  }

  const result = await functions.sendMail({
    senderName: 'MedVA',
    senderEmail: 'sales@tpz.services',
    message: html(zoomId, zoomPassword, zoomLink),
    recipient,
    subject: subject(clientName ?? 'MedVA Virtual Assistant'),
    attachments: [
      {
        filename: 'logo.png',
        path: path.join(__dirname, 'logo.png'),
        cid: 'logo',
      },
    ],
  });

  return result;
};

module.exports = functions;
