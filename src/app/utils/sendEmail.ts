import nodemailer from 'nodemailer';
import config from '../config';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
  },
});

// Common Modern Wrapper
const premiumLayout = (headerContent: string, bodyContent: string) => `
  <div style="background-color: #f4f7f6; padding: 40px 10px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
      
      <!-- Header -->
      <div style="background-color: #D54B46; padding: 40px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">WanderStay</h1>
        <div style="height: 2px; width: 40px; background: rgba(255,255,255,0.3); margin: 15px auto;"></div>
        ${headerContent}
      </div>

      <!-- Main Body -->
      <div style="padding: 40px 30px;">
        ${bodyContent}
      </div>

      <!-- Footer -->
      <div style="background-color: #fafafa; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
        <p style="margin: 0; color: #999999; font-size: 13px;">
          Need help? <a href="${config.frontend_url}/contact" style="color: #D54B46; text-decoration: none;">Contact Support</a> or visit our <a href="${config.frontend_url}/faq" style="color: #D54B46; text-decoration: none;">Help Center</a>
        </p>
        <p style="margin: 10px 0 0 0; color: #bbbbbb; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">
          © 2026 WanderStay. 123 Hotel Avenue, Amsterdam, NL.
        </p>
      </div>
    </div>
  </div>
`;

// 1. Booking Confirmation Email (Modern Card Design)
export const sendBookingEmail = async (to: string, bookingData: any) => {
  const refId = bookingData.supplierReference || "N/A";
  
  const header = `<h2 style="color: #ffffff; margin: 0; font-size: 22px;">Booking Confirmed! ✈️</h2>`;
  
  const body = `
    <p style="font-size: 16px; color: #444; margin-top: 0;">Hi <b>${bookingData.guestDetails.firstName}</b>,</p>
    <p style="font-size: 15px; color: #666;">Get ready for your stay! Your reservation at <b>${bookingData.hotelInfo.hotelName}</b> has been successfully secured.</p>
    
    <div style="border: 1px solid #e0e0e0; border-radius: 12px; padding: 25px; margin: 30px 0; background-color: #fdfdfd;">
      <h3 style="margin: 0 0 5px 0; font-size: 18px; color: #333;">${bookingData.hotelInfo.hotelName}</h3>
      <p style="margin: 0 0 20px 0; font-size: 14px; color: #D54B46; font-weight: 500;">📍 ${bookingData.hotelInfo.city}</p>
      
      <table width="100%" style="border-collapse: collapse;">
        <tr>
          <td style="padding-bottom: 15px;">
            <div style="font-size: 11px; color: #999; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">CHECK-IN</div>
            <div style="font-size: 15px; font-weight: 600; color: #333;">${bookingData.checkIn}</div>
          </td>
          <td style="padding-bottom: 15px;">
            <div style="font-size: 11px; color: #999; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">CHECK-OUT</div>
            <div style="font-size: 15px; font-weight: 600; color: #333;">${bookingData.checkOut}</div>
          </td>
        </tr>
        <tr>
          <td>
            <div style="font-size: 11px; color: #999; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">REFERENCE ID</div>
            <div style="font-size: 14px; font-family: monospace; font-weight: bold; background: #eee; padding: 2px 6px; border-radius: 4px; display: inline-block;">#${refId}</div>
          </td>
          <td>
            <div style="font-size: 11px; color: #999; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">TOTAL PAID</div>
            <div style="font-size: 18px; font-weight: 700; color: #2ecc71;">$${bookingData.totalAmount}</div>
          </td>
        </tr>
      </table>
    </div>

    <div style="text-align: center;">
      <a href="${config.frontend_url}/my-bookings" style="background-color: #D54B46; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: 700; display: inline-block; font-size: 14px; box-shadow: 0 4px 12px rgba(213, 75, 70, 0.3);">Manage Your Trip</a>
    </div>
  `;

  await transporter.sendMail({
    from: `"WanderStay" <${config.SMTP_USER}>`,
    to,
    subject: `Confirmed! Your reservation at ${bookingData.hotelInfo.hotelName}`,
    html: premiumLayout(header, body),
  });
};

// 2. Cancellation Email (Clean Alert Design)
export const sendCancellationEmail = async (to: string, bookingData: any) => {
  const header = `<h2 style="color: #ffffff; margin: 0; font-size: 22px;">Reservation Cancelled</h2>`;
  
  const body = `
    <p style="font-size: 16px; color: #444; margin-top: 0;">Hi <b>${bookingData.guestDetails.firstName}</b>,</p>
    <p style="font-size: 15px; color: #666;">We're confirming that your booking at <b>${bookingData.hotelInfo.hotelName}</b> has been cancelled.</p>
    
    <div style="background-color: #fff5f5; border: 1px solid #ffe3e3; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
      <div style="font-size: 12px; color: #D54B46; font-weight: bold; text-transform: uppercase; margin-bottom: 10px;">Refund Status</div>
      <div style="font-size: 28px; font-weight: 800; color: #333; margin-bottom: 5px;">$${bookingData.totalAmount}</div>
      <p style="margin: 0; font-size: 14px; color: #777;">Refund initiated to your original payment method.</p>
    </div>

    <p style="font-size: 14px; color: #888; line-height: 1.5;">It usually takes <b>5-10 business days</b> for the funds to appear in your account, depending on your bank's processing time.</p>
  `;

  await transporter.sendMail({
    from: `"WanderStay" <${config.SMTP_USER}>`,
    to,
    subject: `Cancelled: Stay at ${bookingData.hotelInfo.hotelName}`,
    html: premiumLayout(header, body),
  });
};

// 3. OTP Email (Security Focused Design)
export const sendOTPEmail = async (to: string, otp: string) => {
  const header = `<h2 style="color: #ffffff; margin: 0; font-size: 22px;">Account Security</h2>`;
  
  const body = `
    <p style="font-size: 16px; color: #444; margin-top: 0; text-align: center;">Hello!</p>
    <p style="font-size: 15px; color: #666; text-align: center;">Use the code below to verify your action on WanderStay. This code is valid for <b>60 seconds</b>.</p>
    
    <div style="margin: 40px 0; text-align: center;">
      <div style="display: inline-block; background: #f8f9fa; padding: 20px 40px; border-radius: 12px; border: 2px solid #D54B46; font-size: 36px; font-weight: 800; color: #D54B46; letter-spacing: 8px;">
        ${otp}
      </div>
    </div>
    
    <p style="font-size: 13px; color: #999; text-align: center;">If you did not request this, please change your password immediately or contact our support team.</p>
  `;

  await transporter.sendMail({
    from: `"WanderStay" <${config.SMTP_USER}>`,
    to,
    subject: `${otp} is your verification code`,
    html: premiumLayout(header, body),
  });
};