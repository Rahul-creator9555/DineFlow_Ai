import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerChatId: { type: String },
  bookingDetails: { type: String, required: true },
  guestCount: { type: Number, default: 2 },
  status: { type: String, enum: ['confirmed', 'cancelled', 'seated'], default: 'confirmed' }
}, { timestamps: true });

export default mongoose.models.Reservation || mongoose.model('Reservation', reservationSchema);