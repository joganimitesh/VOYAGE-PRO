const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const { generateInvoicePdf } = require("./generateInvoicePdf");
const { promisify } = require("util");

const unlinkAsync = promisify(fs.unlink);

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn("⚠️ WARNING: Missing EMAIL_USER or EMAIL_PASS in environment variables.");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS?.replace(/\s+/g, ""),
  },
});

/* ======================================================
✉️ Send OTP Email (for Registration)
====================================================== */
const sendOtpEmail = async (to, otp) => {
  try {
    const mailOptions = {
      from: `"Voyage" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Your Verification Code for Voyage",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; border: 1px solid #ddd; border-radius: 5px; max-width: 600px; margin: auto;">
          <h2 style="color: #0d9488; text-align: center;">Welcome to Voyage!</h2>
          <p style="text-align: center;">Thank you for registering. Please use the following OTP to verify your email:</p>
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; color: #0d9488;">${otp}</p>
          <p style="text-align: center;">This code is valid for <strong>10 minutes</strong>.</p>
          <p style="text-align: center; color: #777;">If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent successfully to ${to}`);
  } catch (error) {
    console.error(`❌ Error sending OTP email to ${to}:`, error.message);
    throw new Error("Could not send verification email.");
  }
};

// ✅ --- START: NEW PASSWORD RESET EMAIL ---
/* ======================================================
🔑 Send Password Reset OTP Email
====================================================== */
const sendPasswordResetOtpEmail = async (to, otp) => {
  try {
    const mailOptions = {
      from: `"Voyage" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Your Password Reset Code for Voyage",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; border: 1px solid #ddd; border-radius: 5px; max-width: 600px; margin: auto;">
          <h2 style="color: #0d9488; text-align: center;">Password Reset Request</h2>
          <p style="text-align: center;">You requested a password reset. Please use the following OTP to set a new password:</p>
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; color: #0d9488;">${otp}</p>
          <p style="text-align: center;">This code is valid for <strong>10 minutes</strong>.</p>
          <p style="text-align: center; color: #777;">If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Password Reset OTP email sent successfully to ${to}`);
  } catch (error) {
    console.error(`❌ Error sending Password Reset OTP email to ${to}:`, error.message);
    throw new Error("Could not send password reset email.");
  }
};
// ✅ --- END: NEW PASSWORD RESET EMAIL ---


/* ======================================================
🧾 Send Booking Confirmation with Invoice
====================================================== */
const sendBookingConfirmationEmail = async (to, bookingDetails) => {
  const { clientName, packageName, date, guests, totalAmount, transactionId, isAddOn, previousLocation } = bookingDetails;
  const formattedDate = new Date(date).toLocaleDateString("en-IN");

  const invoicesDir = path.join(__dirname, "..", "tmp", "invoices");
  if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir, { recursive: true });
  }

  const invoicePath = path.join(invoicesDir, `invoice-${transactionId}.pdf`);

  try {
    await generateInvoicePdf(bookingDetails, invoicePath);

    // ✅ --- Customized Content for Add-on ---
    const subject = isAddOn
      ? `Trip Extended! Your Journey to ${packageName} is Confirmed 🌍`
      : `Your Voyage Booking for ${packageName} is Confirmed!`;

    const introHTML = isAddOn
      ? `<p>Your adventure continues! We are thrilled to confirm your trip extension from <strong>${previousLocation}</strong> to <strong>${packageName}</strong>.</p>
         <p style="background-color: #f0fdf4; padding: 10px; border-radius: 5px; border-left: 4px solid #16a34a; color: #166534; font-size: 14px;">
           <strong>✨ Seamless Transition:</strong> Your documents have been linked from your previous trip.
         </p>`
      : `<p>We are thrilled to confirm your adventure with Voyage. Get ready for your trip to <strong>${packageName}</strong>!</p>`;

    const mailOptions = {
      from: `"Voyage" <${process.env.EMAIL_USER}>`,
      to,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
          <h1 style="color: #0d9488; text-align: center;">${isAddOn ? "Trip Extension Confirmed!" : "Booking Confirmed!"}</h1>
          <h2>${isAddOn ? "Keep Exploring" : "Thank You for Your Booking"}, ${clientName}!</h2>
          ${introHTML}
          <h3>Your Trip Details:</h3>
          <ul>
            <li><strong>Date:</strong> ${formattedDate}</li>
            <li><strong>Guests:</strong> ${guests}</li>
            <li><strong>Total Paid:</strong> ₹${totalAmount.toLocaleString("en-IN")}</li>
            <li><strong>Transaction ID:</strong> ${transactionId}</li>
          </ul>
          <p>Your detailed invoice is attached to this email as a PDF.</p>
          <hr style="border-top: 1px solid #eee; margin: 20px 0;">
          <p style="text-align: center;">We wish you a fantastic and memorable journey!</p>
          <p><strong>— The Voyage Team</strong></p>
        </div>
      `,
      attachments: [
        {
          filename: `Voyage-Invoice-${transactionId}.pdf`,
          path: invoicePath,
          contentType: "application/pdf",
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Booking confirmation email + invoice sent to ${to}`);
  } catch (error) {
    console.error("❌ Error sending booking confirmation email:", error.message);
  } finally {
    if (fs.existsSync(invoicePath)) {
      try {
        await unlinkAsync(invoicePath);
      } catch (cleanupError) {
        console.warn("⚠️ Failed to delete temporary invoice file:", cleanupError.message);
      }
    }
  }
};

/* ======================================================
⏰ Send 7-Day Reminder Email
====================================================== */
const sendReminderEmail = async (to, clientName, packageName, startDate) => {
  const formattedDate = new Date(startDate).toLocaleDateString("en-IN", {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const mailOptions = {
    from: `"Voyage" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Only 7 Days Left! 🌍 Get Ready for ${packageName}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
        <h2 style="color: #0d9488; text-align: center;">The Countdown Begins! ⏳</h2>
        <p>Dear <strong>${clientName}</strong>,</p>
        <p>Are your bags packed? Your adventure to <strong>${packageName}</strong> is just 7 days away!</p>
        
        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0;">
          <p style="margin: 0; color: #166534; font-weight: bold; text-align: center;">
            Start Date: ${formattedDate}
          </p>
        </div>

        <p>Here are a few things to double-check before you go:</p>
        <ul>
          <li>✅ Travel Documents (Passport, ID, Tickets)</li>
          <li>✅ Packing Essentials (Sunscreen, Chargers, Power Bank)</li>
          <li>✅ Check the Weather Forecast</li>
        </ul>

        <p>We are so excited for you to experience this journey. Be ready to make some unforgettable memories!</p>
        
        <p style="text-align: center; margin-top: 30px; font-size: 14px; color: #666;">
          Need help? <a href="#" style="color: #0d9488;">Contact Support</a>
        </p>

        <hr style="border-top: 1px solid #eee; margin: 20px 0;">
        <p><strong>— The Voyage Team</strong></p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Reminder email sent to ${to} for package ${packageName}`);
  } catch (error) {
    console.error(`❌ Error sending reminder email to ${to}:`, error.message);
  }
};

/* ======================================================
💬 Send Admin Response Email
====================================================== */
const sendAdminResponseEmail = async (to, name, subject, response) => {
  const safeResponse = response
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");

  const mailOptions = {
    from: `"Voyage Support" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Re: ${subject}`,
    html: `
      <div style="font-family: sans-serif; color: #333; line-height: 1.6;">
        <h3>Hello ${name},</h3>
        <p>Thank you for contacting Voyage. Here’s our response to your query:</p>
        <div style="background-color: #f9f9f9; border-left: 4px solid #0d9488; padding: 15px; margin: 20px 0;">
          <p>${safeResponse}</p>
        </div>
        <p>If you have further questions, please reply to this email.</p>
        <p>Best regards,</p>
        <p><strong>The Voyage Support Team</strong></p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Admin response sent to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send admin response to ${to}:`, error.message);
  }
};

module.exports = {
  sendOtpEmail,
  sendPasswordResetOtpEmail, // ✅ Export new function
  sendBookingConfirmationEmail,
  sendAdminResponseEmail,
  sendReminderEmail, // ✅ Export reminder function
};