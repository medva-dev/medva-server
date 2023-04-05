const path = require('path');
const nodemailer = require('nodemailer');
const moment = require('moment-timezone');
const db = require('../_init');
const { v4 } = require('uuid');
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
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    secureConnection: false,
    tls: { ciphers: 'SSLv3' },
  });

  const response = await transporter.sendMail(mailOptions);
  return response;
};

const subject = (name) => `Appointment: ${name}`;

const html = (id, password, link, date, timezone) => {
  return `
      <br>
      <br>
      <h3>You are invited to a scheduled Zoom meeting</h3>
      <br/>

      Join Zoom Meeting:
      <br>
      <a href="${link}">${link}</a>
      <br>
      <br>
      <b>Meeting ID:</b> ${id}
      <br/>
      <b>Passcode:</b> ${password}
      <br>
      <br/>
      <b>Date</b>: ${date}
      <br/>
      <b>Timezone</b>: ${timezone}
      <br/><br/>
      See you,
      <br>
      <img src="cid:logo"  width="150"/>
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

functions.emailConfirmation = async (user = {}) => {
  const { id, email, raw_user_meta_data = {} } = user;

  if (!raw_user_meta_data?.token) {
    throw new Error('No token found in user metadata. Please register again');
  }

  const subject = `Please confirm your registration`;

  const link = new URL(
    `confirm?id=${id}&token=${raw_user_meta_data.token}`,
    process.env.CLIENT_APP_URL
  ).href;

  const html = `
  Hi ${String(raw_user_meta_data?.name).split(' ')?.[0]},<br/>
  <br/>
  To complete your registration process,<br/>
  we kindly ask that you <strong><a href='${link}' target='_blank'>confirm your email address by clicking here</a></strong>.
  <br/>
  <br/>
  Once your registration has been confirmed, you will be able to access our pool of virtual assitants.
  <br/><br/>
  Thank you very much!
  <br/><br/>
  Best regards,
  <br/>
  <br/>
  <img src="cid:logo"  width="150"/>`;

  const log = {
    subject,
    recipients: [email],
    body: html,
  };

  try {
    const result = await functions.sendMail({
      senderName: process.env.COMPANY_NAME,
      senderEmail: process.env.SMTP_USER,
      message: html,
      recipient: email,
      subject,
      attachments: [
        {
          filename: 'logo.png',
          path: path.join(__dirname, 'logo.png'),
          cid: 'logo',
        },
      ],
    });

    log.response = JSON.stringify(result);
  } catch (e) {
    log.error = e.message;
    throw new Error(
      'There was an error while sending you the confirmation link. Please try again. If this error persists, please contact our support'
    );
  }
  try {
    await db('mailLogs').insert(log);
  } catch (e) {
    console.error(e);
  }

  return log;
};

functions.sendPasswordResetLink = async (uid) => {
  const user = await db('auth.users').where('id', uid).first();

  if (!user) {
    throw new Error('Invalid account');
  }

  const { id, email, raw_user_meta_data = {} } = user;

  const resetPasswordToken = v4();
  raw_user_meta_data.resetPasswordToken = v4();

  await db('auth.users').update({ raw_user_meta_data }).where('id', user.id);

  const subject = `Password reset request`;

  const link = new URL(
    `reset-password?id=${id}&token=${raw_user_meta_data.resetPasswordToken}`,
    process.env.CLIENT_APP_URL
  ).href;

  const html = `
  Hi ${String(raw_user_meta_data?.name).split(' ')?.[0]},<br/>
  <br/>
  Someone has requested a password reset for your account.<br/>
  You can set a new password using the link below:<br/>
  <br/>
<strong><a href='${link}' target='_blank'>Change password</a></strong><br/>
<br/>
If you didn't request this, please ignore this email.<br/>
Your password won't be changed unless you click into the link above.<br/>
<br/><br/>
Best regards,
<br/>
<br/>
<img src="cid:logo"  width="150"/>`;

  const log = {
    subject,
    recipients: [email],
    body: html,
  };

  try {
    const result = await functions.sendMail({
      senderName: process.env.COMPANY_NAME,
      senderEmail: process.env.SMTP_USER,
      message: html,
      recipient: email,
      subject,
      attachments: [
        {
          filename: 'logo.png',
          path: path.join(__dirname, 'logo.png'),
          cid: 'logo',
        },
      ],
    });

    log.response = JSON.stringify(result);
  } catch (e) {
    log.error = e.message;
    throw new Error(
      'There was an error while sending you the password reset link. Please try again. If this error persists, please contact our support'
    );
  }
  try {
    await db('mailLogs').insert(log);
  } catch (e) {
    console.error(e);
  }

  return log;
};

functions.sendMeetingInvitations = async (meeting = {}) => {
  if (!meeting.id) {
    throw new Error(`No Zoom ID`);
  }

  if (!meeting.password) {
    throw new Error(`No Zoom Password`);
  }

  if (!meeting.joinUrl) {
    throw new Error(`No Zoom Link`);
  }

  const recipient = [];

  meeting?.attendees?.forEach((e) => {
    recipient.push(e.email);
  });

  if (recipient.length < 1) {
    throw new Error('No recipient found');
  }

  const date = moment.tz(meeting.date, meeting.timezone);

  const result = await functions.sendMail({
    senderName: 'MedVA',
    senderEmail: 'sales@tpz.services',
    message: html(
      meeting.id,
      meeting.password,
      meeting.joinUrl,
      date.format('llll'),
      meeting.timezone
    ),
    recipient,
    subject: meeting.topic,
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
