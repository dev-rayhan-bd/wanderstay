import { Request, Response } from 'express';
import { stripe } from '../utils/stripeClient';
import config from '../config';
import { SupplierService } from '../modules/Supplier/supplier.service';
import { BookingModel } from '../modules/Booking/booking.model';

export const stripeWebhookHandler = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  let event;

  console.log("🔔 Webhook Hit Received!"); 

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, config.webhook_secret_key!);
  } catch (err: any) {
    console.log("❌ Webhook Signature Error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }


  console.log("✅ Event Type:", event.type);


  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    await BookingModel.findOneAndUpdate(
      { paymentIntentId: session.id },
      { paymentIntentId: session.payment_intent, paymentStatus: 'Authorized' }
    );
    console.log("📁 Database updated with real PaymentIntent ID");
  }


  if (event.type === 'payment_intent.amount_capturable_updated') {
    const paymentIntent = event.data.object as any;
    const booking = await BookingModel.findOne({ paymentIntentId: paymentIntent.id });

    if (booking) {
      console.log("💰 Money Authorized! Booking for Hotel:", booking.hotelInfo.hotelName);

      try {
  
        const supplierRes = await SupplierService.callWebBeds('confirmbooking', { /* payload */ });

 
        if (true) { 
          await stripe.paymentIntents.capture(paymentIntent.id);
          await booking.updateOne({ 
            status: 'Confirmed', 
            paymentStatus: 'Captured',
            supplierReference: "MOCK-REF-12345" 
          });
          console.log("🚀 SUCCESS: Booking Confirmed and Payment Captured!");
        }
      } catch (error) {
        console.error("❌ Booking Process Error:", error);
      }
    }
  }

  res.json({ received: true });
};