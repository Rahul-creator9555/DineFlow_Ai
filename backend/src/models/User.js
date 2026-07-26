import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Optional for Google OAuth users
  role: { 
    type: String, 
    enum: ['admin', 'manager', 'kitchen', 'waiter', 'customer'], 
    default: 'customer' 
  },
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },
  googleId: { type: String }
}, { timestamps: true });

export default mongoose.model('User', userSchema);