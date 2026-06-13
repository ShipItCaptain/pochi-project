const axios = require('axios');

const sendOtpEmail = async (email, otp, expiryMinutes) => {
  if (process.env.NODE_ENV === 'development' && !process.env.RESEND_API_KEY) {
    console.log(`[DEV] OTP for ${email}: ${otp}`);
    return;
  }

  console.log(`[MAIL] Sending OTP to ${email} via Resend`);
  await axios.post(
    'https://api.resend.com/emails',
    {
      from: 'Pochi <onboarding@resend.dev>',
      to: [email],
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
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  console.log(`[MAIL] OTP sent to ${email} successfully`);
};

module.exports = { sendOtpEmail };
