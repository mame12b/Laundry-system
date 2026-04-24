import mongoose from "mongoose";

const priceItemSchema = new mongoose.Schema({
    name: { type: String, required: true },        // unified field name
    pricePerUnit: { type: Number, required: true },
    unit: { type: String, required: true, default: "pc" },
    active: { type: Boolean, default: true },
}, { timestamps: true }
);
export default mongoose.model('PriceItem', priceItemSchema);