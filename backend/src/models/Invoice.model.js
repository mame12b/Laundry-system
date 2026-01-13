import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    month: { type: String, required: true },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
}, { timestamps: true }
);

export default mongoose.model('Invoice', invoiceSchema);