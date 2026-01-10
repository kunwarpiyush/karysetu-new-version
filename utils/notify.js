// Minimal notification helper.
// - If SMTP env vars are provided, sends email via nodemailer.
// - If Twilio env vars are provided, sends SMS via Twilio.
// - Otherwise it logs the notification to console (safe fallback).

const sendEmail = async (to, subject, text) => {
  try {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.FROM_EMAIL || user;

    if (!host || !user || !pass) {
      console.log('[notify] SMTP not configured — email skipped', { to, subject, text });
      return;
    }

    let nodemailer;
    try { nodemailer = require('nodemailer'); } catch (e) {
      console.log('[notify] nodemailer not installed — email skipped');
      return;
    }

    const transporter = nodemailer.createTransport({
      host, port: Number(port) || 587, secure: false,
      auth: { user, pass }
    });

    await transporter.sendMail({ from, to, subject, text });
    console.log('[notify] Email sent to', to);
  } catch (err) {
    console.error('[notify] sendEmail error', err.message || err);
  }
};

const sendSMS = async (to, message) => {
  try {
    const sid = process.env.TWILIO_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM;

    if (!sid || !token || !from) {
      console.log('[notify] Twilio not configured — SMS skipped', { to, message });
      return;
    }

    let twilio;
    try { twilio = require('twilio'); } catch (e) {
      console.log('[notify] twilio package not installed — SMS skipped');
      return;
    }

    const client = twilio(sid, token);
    await client.messages.create({ body: message, from, to });
    console.log('[notify] SMS sent to', to);
  } catch (err) {
    console.error('[notify] sendSMS error', err.message || err);
  }
};

module.exports = { sendEmail, sendSMS };