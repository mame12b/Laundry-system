import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required : true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    amount: { type: Number, required: true },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

}, {timestamps: true}
);

export default mongoose.model("Payment", paymentSchema);