import { stripe } from '../../utils/stripeClient';
import { BookingModel } from './booking.model';
import config from '../../config';
import { calculateFinalPrice } from '../../utils/priceCalculator';
import { TBooking } from './booking.interface';
// src/app/modules/Booking/booking.service.ts

const initiateBookingInDB = async (payload: TBooking, userId: string) => {

  const priceInfo = calculateFinalPrice(payload.totalAmount);

  // ২. Stripe Checkout Session 
  const session = await stripe.checkout.sessions.create({

    payment_method_types: ['card'], 
    
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: payload.hotelInfo.hotelName,
          description: `${payload.roomInfo.roomName} (${payload.checkIn} to ${payload.checkOut})`,
        },
        unit_amount: priceInfo.finalPrice * 100,
      },
      quantity: 1,
    }],
    mode: 'payment',
    payment_intent_data: {
  
      capture_method: 'manual', 
      metadata: {
        userId: userId.toString(),
        originalPrice: priceInfo.originalPrice.toString(), 
        markup: priceInfo.markupAmount.toString() 
      }
    },
    success_url: `${config.frontend_url}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.frontend_url}/checkout`,
  });


  await BookingModel.create({
    ...payload,
    user: userId,
    totalAmount: priceInfo.finalPrice,
    paymentIntentId: session.id,    
    status: 'Pending',
    paymentStatus: 'Unpaid',
  });

  return { paymentUrl: session.url };
};

export const BookingService = { initiateBookingInDB };