import nodemailer from 'nodemailer';

const address = 'secretariat@futahumboldtkolleg.org';

/** Send one conference notification from the authenticated secretariat mailbox. */
export async function sendZohoMail(to, subject, html, attachment) {
  const transport = nodemailer.createTransport({
    host: 'smtppro.zoho.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {user: address, pass: process.env.ZOHO_SMTP_PASSWORD},
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 8000,
    disableFileAccess: true,
    disableUrlAccess: true
  });
  try {
    const result = await transport.sendMail({
      from: {name: 'FUTA Humboldt Kolleg Conference', address},
      to: {name: '', address: to}, subject, html,
      attachments: attachment && [{...attachment, contentType: 'application/pdf'}]
    });
    return result.accepted.length === 1;
  } catch (error) {
    console.error('Conference SMTP send failed', error.code || 'SMTP_ERROR');
    return false;
  }
}
