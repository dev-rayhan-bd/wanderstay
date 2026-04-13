import { stripe } from '../../utils/stripeClient';
import { TBooking } from './booking.interface';
import { BookingModel } from './booking.model';

const initiateBookingInDB = async (payload: TBooking) => {
  // Stripe Payment Intent(Manual Capture mode)
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(payload.totalAmount * 100), //convert to cents
    currency: 'usd',
    payment_method_types: ['card'],
    capture_method: 'manual', // Hold the funds until we confirm with the supplier
    metadata: {
      email: payload.guestDetails.email,
      hotelName: payload.hotelInfo.hotelName,
    },
  });

  // save on db with status 'Pending' and paymentStatus 'Unpaid'
  const bookingData = {
    ...payload,
    paymentIntentId: paymentIntent.id,
    paymentStatus: 'Unpaid',
    status: 'Pending',
  };

  const result = await BookingModel.create(bookingData);

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    booking: result,
  };
};

export const BookingService = { initiateBookingInDB };