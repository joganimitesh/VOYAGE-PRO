const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

async function generateInvoicePdf(bookingDetails, invoicePath) {
  return new Promise((resolve, reject) => {
    try {
      const dir = path.dirname(invoicePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const writeStream = fs.createWriteStream(invoicePath);
      doc.pipe(writeStream);

      const primaryColor = "#0d9488"; // Teal
      const fontColor = "#333333";
      const lightGray = "#f3f4f6";

      const generateHr = (y) =>
        doc
          .moveTo(40, y)
          .lineTo(doc.page.width - 40, y)
          .strokeColor(lightGray)
          .stroke();

      // Header
      doc.rect(0, 0, doc.page.width, 90).fill(primaryColor);
      doc
        .fontSize(22)
        .fillColor("#FFFFFF")
        .font("Helvetica-Bold")
        .text("Voyage Travel Agency", { align: "center" }, 40);
      doc
        .fontSize(16)
        .fillColor("#FFFFFF")
        .font("Helvetica-Bold")
        .text("INVOICE", 0, 48, { align: "right", marginRight: 40 });
      doc.y = 110;

      // Billing & Invoice Info
      const infoTop = doc.y;
      const leftX = 40;
      const rightX = 350;
      const safe = (value) => value || "N/A";

      doc.font("Helvetica-Bold").fontSize(10).fillColor(fontColor);
      doc.text("Bill To:", leftX, infoTop);
      doc.font("Helvetica").text(safe(bookingDetails.clientName), leftX, infoTop + 15);
      doc.text(safe(bookingDetails.clientEmail), leftX, infoTop + 30);
      doc.text(safe(bookingDetails.clientPhone), leftX, infoTop + 45);

      doc.font("Helvetica-Bold").text("Invoice #:", rightX, infoTop);
      doc.font("Helvetica").text(safe(bookingDetails.transactionId), rightX + 80, infoTop);
      doc.font("Helvetica-Bold").text("Booking Date:", rightX, infoTop + 15);
      doc
        .font("Helvetica")
        .text(
          new Date(bookingDetails.createdAt || Date.now()).toLocaleDateString("en-IN"),
          rightX + 80,
          infoTop + 15
        );

      doc.y = infoTop + 65;
      generateHr(doc.y);
      doc.moveDown(2);

      // Trip Details
      doc.fontSize(12).font("Helvetica-Bold").text("Your Trip Details", leftX, doc.y);
      doc.moveDown();
      const tripDetailsTop = doc.y;
      doc.fontSize(10).font("Helvetica");

      doc
        .font("Helvetica-Bold")
        .text("Package:", leftX + 10, tripDetailsTop)
        .font("Helvetica")
        .text(safe(bookingDetails.packageName), leftX + 110, tripDetailsTop);

      doc
        .font("Helvetica-Bold")
        .text("Location:", leftX + 10, tripDetailsTop + 15)
        .font("Helvetica")
        .text(safe(bookingDetails.location), leftX + 110, tripDetailsTop + 15);

      doc
        .font("Helvetica-Bold")
        .text("Duration:", leftX + 10, tripDetailsTop + 30)
        .font("Helvetica")
        .text(`${safe(bookingDetails.duration)} Days`, leftX + 110, tripDetailsTop + 30);

      doc
        .font("Helvetica-Bold")
        .text("Travel Date:", rightX, tripDetailsTop)
        .font("Helvetica")
        .text(
          new Date(bookingDetails.date || Date.now()).toLocaleDateString("en-IN"),
          rightX + 80,
          tripDetailsTop
        );

      doc
        .font("Helvetica-Bold")
        .text("Guests:", rightX, tripDetailsTop + 15)
        .font("Helvetica")
        .text(bookingDetails.guests || "N/A", rightX + 80, tripDetailsTop + 15);

      // Special Requests
      if (bookingDetails.requests) {
        doc
          .font("Helvetica-Bold")
          .text("Special Requests:", leftX + 10, tripDetailsTop + 50)
          .font("Helvetica")
          .text(safe(bookingDetails.requests), leftX + 110, tripDetailsTop + 50, {
            width: 400,
          });
      }

      doc.y = bookingDetails.requests ? tripDetailsTop + 80 : tripDetailsTop + 50;
      generateHr(doc.y);
      doc.moveDown(2);

      // Payment Summary
      doc.fontSize(12).font("Helvetica-Bold").text("Payment Summary", leftX, doc.y);
      doc.moveDown();
      const tableTop = doc.y;

      doc.rect(40, tableTop, doc.page.width - 80, 25).fill(lightGray);
      doc.fillColor(fontColor).fontSize(10).font("Helvetica-Bold");
      doc.text("Description", 50, tableTop + 8);
      doc.text("Unit Price", 300, tableTop + 8, { width: 90, align: "right" });
      doc.text("Quantity", 390, tableTop + 8, { width: 90, align: "right" });
      doc.text("Total", 0, tableTop + 8, { align: "right", marginRight: 40 });

      const itemTop = tableTop + 35;
      const totalAmount = bookingDetails.totalAmount || 0;
      const guests = bookingDetails.guests || 1;
      const unitPrice = totalAmount / guests;

      doc.fillColor(fontColor).font("Helvetica").fontSize(10);
      doc.text(safe(bookingDetails.packageName), 50, itemTop);
      doc.text(`₹${unitPrice.toLocaleString("en-IN")}`, 300, itemTop, {
        width: 90,
        align: "right",
      });
      doc.text(guests.toString(), 390, itemTop, { width: 90, align: "right" });
      doc.text(`₹${totalAmount.toLocaleString("en-IN")}`, 0, itemTop, {
        align: "right",
        marginRight: 40,
      });

      const totalY = itemTop + 40;
      doc
        .moveTo(350, totalY)
        .lineTo(doc.page.width - 40, totalY)
        .strokeColor("#aaaaaa")
        .stroke();

      doc.font("Helvetica-Bold").fontSize(12);
      doc.text("Total Paid", 350, totalY + 10, { align: "left" });
      doc.text(`₹${totalAmount.toLocaleString("en-IN")}`, 0, totalY + 10, {
        align: "right",
        marginRight: 40,
      });

      // Footer
      doc.fontSize(8).fillColor(fontColor).font("Helvetica");
      doc.text(
        "Thank you for choosing Voyage Travel Agency! For support, contact hello@voyage.com.",
        40,
        doc.page.height - 50,
        { align: "center", width: doc.page.width - 80 }
      );

      // Handle finish/error
      doc.end();
      doc.on("error", reject);
      writeStream.on("finish", () => resolve());
      writeStream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateInvoicePdf };
