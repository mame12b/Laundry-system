import PDFDocument from "pdfkit";

// Brand colors
const BRAND   = "#1a56db";   // blue header
const DARK    = "#111827";   // near-black text
const GRAY    = "#6b7280";   // muted text
const LIGHT   = "#f3f4f6";   // table row bg
const WHITE   = "#ffffff";
const RED     = "#dc2626";
const GREEN   = "#16a34a";

export const generateInvoicePdf = (invoice, customer, orders, res) => {
  const doc = new PDFDocument({ margin: 0, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=invoice-${invoice._id}.pdf`
  );
  doc.pipe(res);

  const PW = doc.page.width;   // 595
  const PH = doc.page.height;  // 842
  const M  = 48;               // content margin

  /* ── Header bar ─────────────────────────────────── */
  doc.rect(0, 0, PW, 110).fill(BRAND);

  // Company name
  doc
    .fillColor(WHITE)
    .fontSize(26)
    .font("Helvetica-Bold")
    .text("LaundryPro", M, 28, { lineBreak: false });

  // "INVOICE" label (right side)
  doc
    .fillColor("rgba(255,255,255,0.55)")
    .fontSize(11)
    .font("Helvetica")
    .text("INVOICE", PW - M - 70, 28, { width: 70, align: "right" });

  doc
    .fillColor(WHITE)
    .fontSize(22)
    .font("Helvetica-Bold")
    .text(`#${String(invoice._id).slice(-8).toUpperCase()}`, PW - M - 120, 46, {
      width: 120,
      align: "right",
    });

  // Tagline
  doc
    .fillColor("rgba(255,255,255,0.7)")
    .fontSize(10)
    .font("Helvetica")
    .text("Professional Laundry Services", M, 62);

  /* ── Meta strip (white bar below header) ────────── */
  doc.rect(0, 110, PW, 52).fill(LIGHT);

  const metaY = 126;
  const col1  = M;
  const col2  = M + 160;
  const col3  = M + 320;

  // Invoice Month
  doc.fillColor(GRAY).fontSize(8).font("Helvetica").text("INVOICE MONTH", col1, metaY);
  doc
    .fillColor(DARK)
    .fontSize(11)
    .font("Helvetica-Bold")
    .text(invoice.month || "—", col1, metaY + 12);

  // Date issued
  doc.fillColor(GRAY).fontSize(8).font("Helvetica").text("DATE ISSUED", col2, metaY);
  doc
    .fillColor(DARK)
    .fontSize(11)
    .font("Helvetica-Bold")
    .text(new Date().toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }), col2, metaY + 12);

  // Status
  const balance = invoice.totalAmount - invoice.paidAmount;
  const status  = balance <= 0 ? "PAID" : "OUTSTANDING";
  const statusColor = balance <= 0 ? GREEN : RED;
  doc.fillColor(GRAY).fontSize(8).font("Helvetica").text("STATUS", col3, metaY);
  doc
    .fillColor(statusColor)
    .fontSize(11)
    .font("Helvetica-Bold")
    .text(status, col3, metaY + 12);

  /* ── Customer block ──────────────────────────────── */
  let y = 185;

  doc
    .fillColor(DARK)
    .fontSize(9)
    .font("Helvetica-Bold")
    .text("BILLED TO", M, y);

  y += 14;
  doc
    .fillColor(DARK)
    .fontSize(13)
    .font("Helvetica-Bold")
    .text(customer.name || "—", M, y);

  y += 17;
  if (customer.phone) {
    doc.fillColor(GRAY).fontSize(10).font("Helvetica").text(`Phone: ${customer.phone}`, M, y);
    y += 14;
  }
  if (customer.address) {
    doc.fillColor(GRAY).fontSize(10).font("Helvetica").text(`Address: ${customer.address}`, M, y);
    y += 14;
  }
  doc.fillColor(GRAY).fontSize(10).font("Helvetica").text(`Type: ${customer.type || "—"}`, M, y);

  /* ── Divider ─────────────────────────────────────── */
  y += 26;
  doc.moveTo(M, y).lineTo(PW - M, y).strokeColor("#e5e7eb").lineWidth(1).stroke();

  /* ── Items table ─────────────────────────────────── */
  y += 16;

  const COL = {
    name:  { x: M,          w: 220 },
    qty:   { x: M + 225,    w:  60 },
    unit:  { x: M + 295,    w:  80 },
    total: { x: M + 385,    w: PW - M - 385 - M },
  };

  // Table header row
  doc.rect(M, y, PW - 2 * M, 24).fill(BRAND);
  const thY = y + 7;
  const headerStyle = () => doc.fillColor(WHITE).fontSize(8).font("Helvetica-Bold");

  headerStyle().text("ITEM / SERVICE",  COL.name.x + 6,  thY, { width: COL.name.w });
  headerStyle().text("QTY",             COL.qty.x,        thY, { width: COL.qty.w,   align: "center" });
  headerStyle().text("UNIT PRICE",      COL.unit.x,       thY, { width: COL.unit.w,  align: "right"  });
  headerStyle().text("TOTAL",           COL.total.x,      thY, { width: COL.total.w, align: "right"  });

  y += 24;

  // Collect all line items
  const lineItems = [];
  orders.forEach((order) => {
    (order.items || []).forEach((item) => {
      lineItems.push({
        name:  item.item?.name || "Item",
        qty:   Number(item.qty  || 0),
        price: Number(item.price || 0),
        total: Number(item.qty || 0) * Number(item.price || 0),
      });
    });
  });

  lineItems.forEach((item, idx) => {
    const rowH = 28;
    const bg   = idx % 2 === 0 ? WHITE : LIGHT;

    doc.rect(M, y, PW - 2 * M, rowH).fill(bg);

    const textY = y + 9;
    doc.fillColor(DARK).fontSize(10).font("Helvetica-Bold")
       .text(item.name, COL.name.x + 6, textY, { width: COL.name.w - 6, ellipsis: true });

    doc.fillColor(GRAY).fontSize(10).font("Helvetica")
       .text(String(item.qty), COL.qty.x, textY, { width: COL.qty.w, align: "center" });

    doc.fillColor(GRAY).fontSize(10).font("Helvetica")
       .text(fmtAmt(item.price), COL.unit.x, textY, { width: COL.unit.w, align: "right" });

    doc.fillColor(DARK).fontSize(10).font("Helvetica-Bold")
       .text(fmtAmt(item.total), COL.total.x, textY, { width: COL.total.w, align: "right" });

    y += rowH;
  });

  // Bottom border of table
  doc.moveTo(M, y).lineTo(PW - M, y).strokeColor("#e5e7eb").lineWidth(1).stroke();

  /* ── Totals box ──────────────────────────────────── */
  y += 20;

  const totalsX = PW - M - 200;
  const totalsW = 200;

  const drawRow = (label, value, isBold, color) => {
    doc
      .fillColor(GRAY)
      .fontSize(isBold ? 10 : 9)
      .font(isBold ? "Helvetica-Bold" : "Helvetica")
      .text(label, totalsX, y, { width: 110 });

    doc
      .fillColor(color || DARK)
      .fontSize(isBold ? 10 : 9)
      .font(isBold ? "Helvetica-Bold" : "Helvetica")
      .text(value, totalsX + 110, y, { width: 90, align: "right" });

    y += isBold ? 18 : 16;
  };

  drawRow("Total Amount",  fmtAmt(invoice.totalAmount), false);
  drawRow("Paid Amount",   fmtAmt(invoice.paidAmount),  false, GREEN);

  // Divider above balance
  doc.moveTo(totalsX, y).lineTo(totalsX + totalsW, y).strokeColor("#d1d5db").lineWidth(0.8).stroke();
  y += 8;

  const balColor = balance > 0 ? RED : GREEN;
  const balLabel = balance > 0 ? "Balance Due" : "Fully Paid";
  drawRow(balLabel, fmtAmt(balance > 0 ? balance : 0), true, balColor);

  /* ── Footer ──────────────────────────────────────── */
  const footerY = PH - 50;
  doc.rect(0, footerY, PW, 50).fill(LIGHT);

  doc
    .fillColor(GRAY)
    .fontSize(8)
    .font("Helvetica")
    .text(
      "Thank you for choosing LaundryPro  •  Generated automatically by LaundryPro system",
      M,
      footerY + 19,
      { width: PW - 2 * M, align: "center" }
    );

  doc.end();
};

function fmtAmt(n) {
  const num = Number(n || 0);
  return `AED ${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
