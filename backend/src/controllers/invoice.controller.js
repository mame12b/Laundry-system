import Invoice from "../models/Invoice.model.js";
import { generateInvoicePdf } from "../utils/invoicePdf.js";
import Customer from "../models/Customer.model.js";
import Order from "../models/Order.model.js";
import mongoose from "mongoose";

export const generateInvoice = async (req, res) => {
  try {
    const { customer,  month } = req.body;
        const [year, m] = month.split("-");
        const start = new Date(Date.UTC(year, m - 1, 1));
        const end = new Date(Date.UTC(year, m, 1));

    const orders = await Order.aggregate([
        { $match: { customer: new mongoose.Types.ObjectId(customer), createdAt: { $gte: start, $lt: end } } },
        { $group: { _id: "$customer", total: { $sum: "$totalAmount"}, paid: { $sum : "$paidAmount" } } }
    ]);

    if (!orders.length) return res.status(404).json({ message: "No orders found for the specified month" });

    const data = orders[0];

    const invoice = await Invoice.create( {
      customer,
      month,
      totalAmount: data.total,
      paidAmount: data.paid,
    });

    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const downloadInvoicePdf  = async (req, res) => {
  try {
    const invoiceId = req.params.id;

    const invoice = await Invoice.findById(invoiceId);
    if(!invoice) return res.status(404).json({ message: "Invoice not found" });

    const customer = await Customer.findById(invoice.customer);

  const [year, month] = invoice.month.split("-");
const start = new Date(Date.UTC(year, month - 1, 1));
const end = new Date(Date.UTC(year, month, 1));


    const orders = await Order.find({
      customer: invoice.customer,
      createdAt: { $gte: start, $lt: end }
    }).populate("items.item");

    generateInvoicePdf(invoice, customer, orders, res);

  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};