import { stripe } from '../../utils/stripeClient';
import { BookingModel } from './booking.model';
import config from '../../config';
import { calculateFinalPrice } from '../../utils/priceCalculator';
import { TBooking } from './booking.interface';
import QueryBuilder from '../../builder/QueryBuilder';
// src/app/modules/Booking/booking.service.ts

// const initiateBookingInDB = async (payload: TBooking, userId: string) => {

//   const priceInfo = calculateFinalPrice(payload.totalAmount);

//   // ২. Stripe Checkout Session 
//   const session = await stripe.checkout.sessions.create({

//     payment_method_types: ['card'], 
    
//     line_items: [{
//       price_data: {
//         currency: 'usd',
//         product_data: {
//           name: payload.hotelInfo.hotelName,
//           description: `${payload.roomInfo.roomName} (${payload.checkIn} to ${payload.checkOut})`,
//         },
//         unit_amount: priceInfo.finalPrice * 100,
//       },
//       quantity: 1,
//     }],
//     mode: 'payment',
//     payment_intent_data: {
  
//       capture_method: 'manual', 
//       metadata: {
//         userId: userId.toString(),
//         originalPrice: priceInfo.originalPrice.toString(), 
//         markup: priceInfo.markupAmount.toString() 
//       }
//     },
//     success_url: `${config.frontend_url}/success?session_id={CHECKOUT_SESSION_ID}`,
//     cancel_url: `${config.frontend_url}/checkout`,
//   });


//   await BookingModel.create({
//     ...payload,
//     user: userId,
//     totalAmount: priceInfo.finalPrice,
//     paymentIntentId: session.id,    
//     status: 'Pending',
//     paymentStatus: 'Unpaid',
//   });

//   return { paymentUrl: session.url };
// };

const initiateBookingInDB = async (payload: TBooking, userId: string) => {

  const priceInfo = calculateFinalPrice(payload.totalAmount);

  // ২. Stripe Checkout Session তৈরি করা
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'], 
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: payload.hotelInfo.hotelName,
  
          description: `${payload.roomInfo.roomName} | ${payload.checkIn} to ${payload.checkOut}`,
        },

        unit_amount: Math.round(priceInfo.finalPrice * 100), 
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
    paymentIntentId: session.id,       // session id (cs) replaced with real PaymentIntent ID in webhook (pi)
    status: 'Pending',
    paymentStatus: 'Unpaid',
  });

  return { paymentUrl: session.url };
};



// const getMyBookingsFromDB = async (userId: string, query: Record<string, unknown>) => {
//   const currentDate = new Date().toISOString().split('T')[0];  //(YYYY-MM-DD)
  
//   let criteria: any = { user: userId };

//   // 'type' wise filtering: active, history, all
//   if (query.view === 'active') {
//   //active : confirmed and check-out date not passed yet
//     criteria.status = 'Confirmed';
//     criteria.checkOut = { $gte: currentDate };
//   } 
//   else if (query.view === 'history') {
//    //history: either cancelled/failed or check-out date passed
//     criteria.$or = [
//       { status: { $in: ['Cancelled', 'Failed'] } },
//       { checkOut: { $lt: currentDate } }
//     ];
//   }

//   const bookingQuery = new QueryBuilder(BookingModel.find(criteria), query)
//     .filter()
//     .sort()
//     .paginate()
//     .fields();

//   const result = await bookingQuery.modelQuery;
//   const meta = await bookingQuery.countTotal();

//   return { result, meta };
// };


// src/app/modules/Booking/booking.service.ts

const getMyBookingsFromDB = async (userId: string, query: Record<string, unknown>) => {
  const currentDate = new Date().toISOString().split('T')[0];
  

  const queryObj = { ...query };
  const view = queryObj.view;
  delete queryObj.view; 

  let criteria: any = { user: userId };

  if (view === 'active') {

    criteria.status = 'Confirmed';
    criteria.checkOut = { $gte: currentDate };
  } 
  else if (view === 'history') {

    criteria.$or = [
      { status: { $in: ['Cancelled', 'Failed'] } },
      { checkOut: { $lt: currentDate } }
    ];
  }


  const bookingQuery = new QueryBuilder(BookingModel.find(criteria), queryObj)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await bookingQuery.modelQuery;
  const meta = await bookingQuery.countTotal();

  return { result, meta };
};





export const BookingService = { initiateBookingInDB, getMyBookingsFromDB };