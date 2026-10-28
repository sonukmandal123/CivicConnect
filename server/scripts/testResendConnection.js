const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Resend } = require('resend');

async function testResend() {
  console.log('Testing Resend API connection with key:', process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.slice(0, 10) + '...' : 'MISSING');
  
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  try {
    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'CivicConnect <onboarding@resend.dev>',
      to: ['sonumandalsmve@gmail.com'],
      subject: 'CivicConnect Resend Integration Verified',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 24px; color: #ffffff;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">CivicConnect Notification Hub</h1>
            <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 13px;">Municipal Infrastructure & Citizen Engagement Platform</p>
          </div>
          <div style="padding: 24px;">
            <div style="display: inline-block; padding: 4px 10px; background: #dcfce7; color: #166534; font-size: 12px; font-weight: 700; border-radius: 9999px; margin-bottom: 16px;">
              SYSTEM OPERATIONAL
            </div>
            <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #0f172a;">Resend API Key Connected Successfully</h2>
            <p style="margin: 0 0 16px 0; color: #475569; font-size: 14px; line-height: 1.6;">
              Hello Sonu Mandal, your Resend email notification service is now actively connected to CivicConnect.
              You will receive automatic alerts for submitted civic reports, status updates, department assignments, and resolution progress.
            </p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; color: #334155;">
              <strong>Recipient:</strong> sonumandalsmve@gmail.com<br/>
              <strong>Sender:</strong> ${process.env.EMAIL_FROM}<br/>
              <strong>Service:</strong> Resend API
            </div>
            <a href="http://localhost:5173" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 10px 20px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px;">
              Open CivicConnect Portal
            </a>
          </div>
          <div style="padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center;">
            CivicConnect Municipal Intelligence System &copy; ${new Date().getFullYear()}
          </div>
        </div>
      `
    });

    console.log('Resend Response:', data);
    console.log('\nEmail sent successfully! Email ID:', data.data?.id);
  } catch (error) {
    console.error('Resend Error:', error);
  }
}

testResend();
