import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, unique: true },
    type: {
        type: String,
        enum: ['Regular', 'Hotel'],
        default: 'Regular',
    },
    address: { type: String, },
    active: { type: Boolean, default: true },
}, 
{ timestamps: true }

);

export default mongoose.model('Customer', customerSchema);