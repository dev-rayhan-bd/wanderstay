import { Request, Response } from 'express';
import { stripe } from '../utils/stripeClient';
import config from '../config';
import { SupplierService } from '../modules/Supplier/supplier.service';
import { BookingModel } from '../modules/Booking/booking.model';

export const stripeWebhookHandler = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = config.webhook_secret_key;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret!);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // যখন পেমেন্ট Authorized হবে
  if (event.type === 'payment_intent.amount_capturable_updated') {
    const paymentIntent = event.data.object as any;
    const paymentIntentId = paymentIntent.id;

    // ১. ডাটাবেস থেকে বুকিং ডাটা খুঁজে বের করা
    const booking = await BookingModel.findOne({ paymentIntentId });

    if (booking) {
      try {
        // ২. সাপ্লায়ারের (WebBeds) কনফার্মেশন কল করা
// src/app/webhook/webhook.stripe.ts এর ভেতরে

const supplierRes = await SupplierService.callWebBeds('confirmbooking', {
  bookingDetails: {
    fromDate: booking.checkIn,
    toDate: booking.checkOut,
    currency: config.dotw.currency, // "520"
    rooms: {
      $: { no: "1" },
      room: {
        $: { runno: "0" },
        roomTypeCode: booking.roomInfo.roomTypeCode,
        selectedRateBasis: booking.roomInfo.rateBasisId,
        adultsCode: booking.adults,
        passengerName: {
          firstName: booking.guestDetails.firstName,
          lastName: booking.guestDetails.lastName
        }
      }
    },
    productId: booking.hotelInfo.hotelId // এটি rooms এর পরে থাকবে (XSD নিয়ম)
  }
});

        if (supplierRes.result?.successful === "TRUE") {
          // ✅ সাপ্লায়ার ওকে বলেছে! এখন টাকা ক্যাপচার করুন
          await stripe.paymentIntents.capture(paymentIntentId);
          
          await BookingModel.findOneAndUpdate(
            { paymentIntentId },
            { 
              status: 'Confirmed', 
              paymentStatus: 'Captured',
              supplierReference: supplierRes.result.bookingReference 
            }
          );
          console.log("✅ Booking & Payment Success!");
        } else {
          // ❌ সাপ্লায়ার ফেইল! টাকা কাস্টমারকে ফেরত দিন (Rollback)
          await stripe.paymentIntents.cancel(paymentIntentId);
          await BookingModel.findOneAndUpdate(
            { paymentIntentId },
            { status: 'Failed', paymentStatus: 'Cancelled' }
          );
          console.log("❌ Supplier Booking Failed. Payment Rolled Back.");
        }
      } catch (error) {
        await stripe.paymentIntents.cancel(paymentIntentId); // Technical error rollback
        console.error("❌ System error during confirmbooking. Payment Released.");
      }
    }
  }

  res.json({ received: true });
};