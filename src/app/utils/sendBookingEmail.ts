import nodemailer from 'nodemailer';
import config from '../config';

export const sendBookingEmail = async (to: string, bookingData: any) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASS,
    },
  });

// || "WS-" + Math.random().toString(36).substr(2, 9).toUpperCase();

const referenceId = bookingData.supplierReference || "N/A"; 
  const mailOptions = {
    from: `"WanderStay" <${config.SMTP_USER}>`,
    to: to,
    subject: `Confirmed! Your stay at ${bookingData.hotelInfo.hotelName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          .container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6; }
          .header { background: linear-gradient(135deg, #D54B46 0%, #b53a35 100%); padding: 40px 20px; text-align: center; border-radius: 15px 15px 0 0; }
          .header h1 { color: #fff; margin: 0; font-size: 28px; letter-spacing: 1px; }
          .header p { color: #ffeaea; margin-top: 10px; font-size: 16px; }
          
          .content { background: #fff; padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 15px 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
          
          .booking-card { background: #f9f9f9; border-radius: 12px; padding: 20px; margin-bottom: 25px; border-left: 5px solid #D54B46; }
          .hotel-name { font-size: 20px; font-weight: bold; color: #D54B46; margin: 0 0 5px 0; }
          .hotel-location { color: #777; font-size: 14px; margin-bottom: 15px; display: block; }
          
          .details-grid { display: flex; flex-wrap: wrap; margin-bottom: 20px; }
          .detail-item { flex: 1; min-width: 120px; margin-bottom: 15px; }
          .detail-label { font-size: 12px; text-transform: uppercase; color: #999; font-weight: bold; display: block; }
          .detail-value { font-size: 15px; font-weight: 600; color: #333; }
          
          .button-container { text-align: center; margin-top: 30px; }
          .button { background-color: #D54B46; color: #fff !important; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; }
          
          .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
          .footer a { color: #D54B46; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Confirmed!</h1>
            <p>Pack your bags, ${bookingData.guestDetails.firstName}!</p>
          </div>
          
          <div class="content">
            <p>Hi <b>${bookingData.guestDetails.firstName} ${bookingData.guestDetails.lastName}</b>,</p>
            <p>Your reservation is successfully processed. We've notified the hotel of your upcoming arrival.</p>
            
            <div class="booking-card">
              <h2 class="hotel-name">${bookingData.hotelInfo.hotelName}</h2>
              <span class="hotel-location">📍 ${bookingData.hotelInfo.city}, Tirana</span>
              
              <div style="border-top: 1px solid #eee; margin: 15px 0; padding-top: 15px;">
                <table width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td width="50%">
                      <span class="detail-label">Check-in</span>
                      <span class="detail-value">${bookingData.checkIn}</span>
                    </td>
                    <td width="50%">
                      <span class="detail-label">Check-out</span>
                      <span class="detail-value">${bookingData.checkOut}</span>
                    </td>
                  </tr>
                </table>
              </div>
              
              <table width="100%" cellspacing="0" cellpadding="0" style="margin-top: 10px;">
                <tr>
                  <td width="50%">
                    <span class="detail-label">Reference ID</span>
                    <span class="detail-value" style="color: #444;">#${referenceId}</span>
                  </td>
                  <td width="50%">
                    <span class="detail-label">Total Amount</span>
                    <span class="detail-value" style="font-size: 18px; color: #2ecc71;">$${bookingData.totalAmount}</span>
                  </td>
                </tr>
              </table>
            </div>

            <div class="button-container">
              <a href="${config.frontend_url}/my-bookings" class="button">Manage Your Booking</a>
            </div>

            <p style="margin-top: 30px; font-size: 14px;">Need help? Reply to this email or visit our <a href="${config.frontend_url}/help">Help Center</a>.</p>
          </div>
          
          <div class="footer">
            <p>© 2026 WanderStay. All rights reserved.<br/>
            123 Hotel Avenue, Suite 100, Amsterdam, NL 10001</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};