import { stripe } from '../../utils/stripeClient';
import { BookingModel } from './booking.model';
import config from '../../config';
import { calculateFinalPrice } from '../../utils/priceCalculator';
import { TBooking } from './booking.interface';
import QueryBuilder from '../../builder/QueryBuilder';
import { SupplierService } from '../Supplier/supplier.service';
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
//   const currentDate = new Date().toISOString().split('T')[0];
  

//   const queryObj = { ...query };
//   const view = queryObj.view;
//   delete queryObj.view; 

//   let criteria: any = { user: userId };

//   if (view === 'active') {

//     criteria.status = 'Confirmed';
//     criteria.checkOut = { $gte: currentDate };
//   } 
//   else if (view === 'history') {

//     criteria.$or = [
//       { status: { $in: ['Cancelled', 'Failed'] } },
//       { checkOut: { $lt: currentDate } }
//     ];
//   }


//   const bookingQuery = new QueryBuilder(BookingModel.find(criteria), queryObj)
//     .filter()
//     .sort()
//     .paginate()
//     .fields();

//   const result = await bookingQuery.modelQuery;
//   const meta = await bookingQuery.countTotal();

//   return { result, meta };
// };


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


const checkCancellationPenalty = async (id: string) => {
  const booking = await BookingModel.findById(id);
  if (!booking) throw new Error("Booking not found");

 
  const response = await SupplierService.callWebBeds('cancelbooking', {
    bookingDetails: {
      bookingCode: booking.supplierReference,
      confirm: "no" 
    }
  });

  return response.result; 
};



const cancelBookingFromDB = async (bookingId: string) => {
  const booking = await BookingModel.findById(bookingId);

  if (!booking) {
    throw new Error("Booking not found!");
  }

  if (booking.status === 'Cancelled') {
    throw new Error("Booking is already cancelled.");
  }

  const supplierRes = await SupplierService.callWebBeds('cancelbooking', {
    bookingDetails: {
      bookingCode: booking.supplierReference, 
      confirm: "yes" 
    }
  });

  if (supplierRes.result?.successful === "TRUE") {
   
    const refund = await stripe.refunds.create({
      payment_intent: booking.paymentIntentId,
    });

  
    const result = await BookingModel.findByIdAndUpdate(
      bookingId,
      { 
        status: 'Cancelled', 
        paymentStatus: 'Cancelled' 
      },
      { new: true }
    );

    return {
      booking: result,
      refundId: refund.id,
      supplierMessage: "Cancelled Successfully"
    };
  } else {
    throw new Error(supplierRes.result?.error?.details || "Supplier refused cancellation");
  }
};


export const BookingService = { initiateBookingInDB, getMyBookingsFromDB, cancelBookingFromDB };