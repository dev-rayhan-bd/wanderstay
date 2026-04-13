import { Schema, model } from 'mongoose';
import { TBooking } from './booking.interface';

const bookingSchema = new Schema<TBooking>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    guestDetails: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    hotelInfo: {
      hotelId: { type: String, required: true },
      hotelName: { type: String, required: true },
      city: { type: String, required: true },
    },
    roomInfo: {
      roomTypeCode: { type: String, required: true },
      rateBasisId: { type: String, required: true },
      roomName: { type: String, required: true },
      mealPlan: { type: String, required: true },
    },
    checkIn: { type: String, required: true },
    checkOut: { type: String, required: true },
    adults: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    paymentIntentId: { type: String, required: true, unique: true },
    supplierReference: { type: String },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Cancelled', 'Failed'],
      default: 'Pending',
    },
    paymentStatus: {
      type: String,
      enum: ['Unpaid', 'Authorized', 'Captured', 'Cancelled'],
      default: 'Unpaid',
    },
  },
  { timestamps: true }
);

export const BookingModel = model<TBooking>('Booking', bookingSchema);