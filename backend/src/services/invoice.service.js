import PDFDocument from "pdfkit"

export const generateInvoicePdf = (invoice, customer, orders, res)  => {
    const doc = new PDFDocument({ margin: 40});

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.month}.pdf`);

    doc.pipe(res);

    doc.fontSize(20).text('Laundry system Invoice',  {align: 'center'});
    doc.moveDown();

    doc.fontSize(12).text(`Invoice Month: ${invoice.month}`);
    doc.text(`Customer Name: ${customer.name}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    doc.text('Items:',  {underline: true});
    doc.moveDown(0.5);

  orders.forEach(order => {
    order.items.forEach(item => {
      const name = item.item?.name || "Item";
      const line = `${item.qty} x ${name} @ ${item.price} = ${item.qty * item.price}`;
      doc.text("• " + line);
    });
  });
    
    doc.moveDown();
    doc.text(`Total Amount: ${invoice.totalAmount}`, {bold: true});
    doc.text(`Paid Amount: ${invoice.paidAmount}`);
    doc.text(`balance Amount: ${invoice.totalAmount - invoice.paidAmount}`);
    doc.end();
};