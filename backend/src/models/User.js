import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Optional for Google OAuth users
    role: { 
      type: String, 
      enum: ['manager', 'kitchen', 'waiter', 'customer'], 
      default: 'kitchen' 
    },
    isVerified: { type: Boolean, default: false },
    googleId: { type: String },
    otp: { type: String },
    otpExpires: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', userSchema);