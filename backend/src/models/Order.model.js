import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: "PriceItem", required: true },
  qty: { type: Number, required: true },
  price: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional
    status: {
      type: String,
      enum: ["PICKED", "RECEIVED", "WASHING", "IRONING", "READY", "DELIVERED"],
      default: "PICKED",
    },
    items: { type: [orderItemSchema], required: true },
    totalAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

orderSchema.pre("save", function () {
  this.totalAmount = this.items.reduce((sum, i) => sum + i.qty * i.price, 0);
});

export default mongoose.model("Order", orderSchema);
