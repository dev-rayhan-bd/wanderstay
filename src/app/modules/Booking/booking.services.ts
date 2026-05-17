import { stripe } from '../../utils/stripeClient';
import { BookingModel } from './booking.model';
import config from '../../config';
import { calculateFinalPrice } from '../../utils/priceCalculator';
import { TBooking } from './booking.interface';
import QueryBuilder from '../../builder/QueryBuilder';
import { SupplierService } from '../Supplier/supplier.service';
import { sendCancellationEmail } from '../../utils/sendEmail';
import { formatWebBedsName } from '../../utils/webBedsFormatter';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';

const initiateBookingInDB = async (payload: TBooking, userId: string) => {
 const firstName = formatWebBedsName(payload.guestDetails.firstName);
  const lastName = formatWebBedsName(payload.guestDetails.lastName);

 if (firstName.length < 2 || lastName.length < 2) {
    throw new Error("Passenger names must contain at least 2 alphabetic characters.");
  }
    const priceInfo = calculateFinalPrice(payload.totalAmount);
  //  Stripe Checkout Session create
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
      guestDetails: {
      ...payload.guestDetails,
      firstName, 
      lastName  
    },
    user: userId,

  supplierPrice: priceInfo.originalPrice, 
  platformProfit: priceInfo.markupAmount, 
    paymentIntentId: session.id,       // session id (cs) replaced with real PaymentIntent ID in webhook (pi)
    status: 'Pending',
    paymentStatus: 'Unpaid',
  });

  return { paymentUrl: session.url };
};



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

const getCancellationQuote = async (id: string) => {
  const booking = await BookingModel.findById(id);
  if (!booking) throw new Error("Booking not found");

  const response = await SupplierService.callWebBeds('cancelbooking', {
    bookingDetails: {
      bookingCode: booking.supplierReference,
      confirm: "no" //
    }
  });


  const serviceInfo = response.result?.testPricesAndAllocation?.service;
  const penalty = parseFloat(serviceInfo?.penaltyApplied || "0"); 
  

  const refundAmount = booking.totalAmount - penalty;

  return {
    totalPaid: booking.totalAmount,
    penaltyCharge: penalty,
    refundableAmount: refundAmount > 0 ? refundAmount : 0,
    currency: booking.currency,
    isFreeCancellation: penalty === 0
  };
};

const confirmCancellationInDB = async (id: string) => {
  const booking = await BookingModel.findById(id);
  if (!booking) throw new AppError(httpStatus.NOT_FOUND, "Booking not found");


  const quote = await getCancellationQuote(id);


  const supplierRes = await SupplierService.callWebBeds('cancelbooking', {
    bookingDetails: {
      bookingCode: booking.supplierReference,
      confirm: "yes", 
      penaltyApplied: quote.penaltyCharge.toString() 
    }
  });


  if (true) {
    //supplierRes.result?.successful === "TRUE"

    if (quote.refundableAmount > 0) {
      await stripe.refunds.create({
        payment_intent: booking.paymentIntentId,
        amount: Math.round(quote.refundableAmount * 100), 
      });
    }


    const result = await BookingModel.findByIdAndUpdate(
      id,
      { status: 'Cancelled', paymentStatus: 'Cancelled' },
      { new: true }
    );
    
    await sendCancellationEmail(booking.guestDetails.email, booking);
    return result;
  } else {

    const errorMsg = supplierRes.result?.error || "Supplier refused cancellation.";
    throw new AppError(httpStatus.BAD_REQUEST, errorMsg);
  }
};


const getAdminDashboardStats = async () => {
  const stats = await BookingModel.aggregate([
    { 
      $match: { status: 'Confirmed' } 
    },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: "$totalAmount" },   
        totalNetProfit: { $sum: "$platformProfit" }, 
        totalSupplierCost: { $sum: "$supplierPrice" } 
      }
    }
  ]);

  return {
    totalBookings: stats[0]?.totalBookings || 0,
    totalRevenue: stats[0]?.totalRevenue || 0,
    totalProfit: stats[0]?.totalNetProfit || 0,
    supplierPayable: stats[0]?.totalSupplierCost || 0,
    activeHotels: 161
  };
};

const getAllBookingsFromDB = async (query: Record<string, unknown>) => {
  const bookingQuery = new QueryBuilder(BookingModel.find().populate('user'), query)
    .search(['hotelInfo.hotelName', 'guestDetails.firstName', 'guestDetails.email', 'supplierReference'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await bookingQuery.modelQuery;
  const meta = await bookingQuery.countTotal();

  return { result, meta };
};

 

export const BookingService = { initiateBookingInDB, getMyBookingsFromDB,getCancellationQuote, confirmCancellationInDB,getAdminDashboardStats, getAllBookingsFromDB };