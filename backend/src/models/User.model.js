import mongoose from "mongoose";
import bcrypt from "bcrypt";


const userSchema = new mongoose.Schema({
    name:{ type: String , required: true},
    phone:{ type: String , required: true, unique: true },
    role: {
        type: String,
        enum: ['Collector', 'Washer','Sorter','Ironer','Driver','Cashier','Manager','Hotel'],
        required: true,
        default: "Collector"
    },
    password:{ type: String , required: true },
    active:{ type: Boolean , default: true },
}, 
{ timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.comparePassword =  function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};
export default mongoose.model('User', userSchema);
