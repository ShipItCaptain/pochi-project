const nodemailer = require('nodemailer');
const dns = require('dns');
const { promisify } = require('util');

const dnsLookup = promisify(dns.lookup);

// Lazy singleton — created on first send so we can pre-resolve to IPv4.
// Railway can't route IPv6; nodemailer's family:4 option isn't passed to the
// underlying socket, so we resolve the hostname ourselves first.
let _transporter = null;

const getTransporter = async () => {
  if (_transporter) return _transporter;

  const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
  let smtpHost = emailHost;

  try {
    const { address } = await dnsLookup(emailHost, { family: 4 });
    smtpHost = address;
    console.log(`[MAIL] Resolved ${emailHost} → ${smtpHost} (IPv4)`);
  } catch (err) {
    console.warn('[MAIL] DNS pre-resolve failed, using hostname:', err.message);
  }

  _transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    tls: {
      servername: emailHost, // SNI — required when connecting by IP so Gmail's cert validates
    },
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return _transporter;
};

const sendOtpEmail = async (email, otp, expiryMinutes) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[MAIL] No credentials — OTP for ${email}: ${otp}`);
    return;
  }

  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || `Pochi <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Pochi verification code',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-block;width:48px;height:48px;background:#00A651;border-radius:12px;
                      line-height:48px;color:#fff;font-weight:700;font-size:22px;">P</div>
        </div>
        <h2 style="color:#1A1A2E;font-size:18px;margin:0 0 8px;">Your verification code</h2>
        <p style="color:#4B5563;font-size:14px;margin:0 0 24px;">
          Use the code below to verify your Pochi account. It expires in ${expiryMinutes} minutes.
        </p>
        <div style="background:#F7F8FA;border:1px solid #E5E7EB;border-radius:8px;
                    text-align:center;padding:20px;margin-bottom:24px;">
          <span style="font-size:32px;font-weight:700;letter-spacing:12px;color:#1A1A2E;">${otp}</span>
        </div>
        <p style="color:#9CA3AF;font-size:12px;margin:0;">
          Do not share this code with anyone. Pochi will never ask for your code.
        </p>
      </div>
    `,
  });

  console.log(`[MAIL] Sent to ${email}, messageId=${info.messageId}`);
};

module.exports = { sendOtpEmail };
