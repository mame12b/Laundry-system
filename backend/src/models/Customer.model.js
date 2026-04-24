import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, default: null },
    type: {
        type: String,
        enum: ["Individual", "Regular", "Hotel"],
        default: "Individual",
    },
    address: { type: String, default: "" },
    active: { type: Boolean, default: true },
},
{ timestamps: true }
);

export default mongoose.model("Customer", customerSchema);