import mongoose from "mongoose";

const priceItemSchema = new mongoose.Schema({
    itemName: { type: String, required: true },
    pricePerUnit: { type: Number, required: true },
    unit: { type: String, required: true },
    active: { type: Boolean, default: true },
}, { timestamps: true }
);
export default mongoose.model('PriceItem', priceItemSchema);