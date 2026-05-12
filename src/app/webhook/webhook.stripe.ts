// import { Request, Response } from 'express';
// import { stripe } from '../utils/stripeClient';
// import config from '../config';
// import { SupplierService } from '../modules/Supplier/supplier.service';
// import { BookingModel } from '../modules/Booking/booking.model';

// export const stripeWebhookHandler = async (req: Request, res: Response) => {
//   const sig = req.headers['stripe-signature'] as string;
//   let event;

//   console.log("🔔 Webhook Hit Received!"); 

//   try {
//     event = stripe.webhooks.constructEvent(req.body, sig, config.webhook_secret_key!);
//   } catch (err: any) {
//     console.log("❌ Webhook Signature Error:", err.message);
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }


//   console.log("✅ Event Type:", event.type);


//   if (event.type === 'checkout.session.completed') {
//     const session = event.data.object as any;
//     await BookingModel.findOneAndUpdate(
//       { paymentIntentId: session.id },
//       { paymentIntentId: session.payment_intent, paymentStatus: 'Authorized' }
//     );
//     console.log("📁 Database updated with real PaymentIntent ID");
//   }


//   if (event.type === 'payment_intent.amount_capturable_updated') {
//     const paymentIntent = event.data.object as any;
//     const booking = await BookingModel.findOne({ paymentIntentId: paymentIntent.id });




// if (booking) {
//   console.log("💰 Money Authorized! Booking for Hotel:", booking.hotelInfo.hotelName);

//   try {

//     const supplierPayload = {
//       bookingDetails: {
//         fromDate: booking.checkIn,
//         toDate: booking.checkOut,
//         currency: config.dotw.currency, // "520"
//         rooms: {
//           $: { no: "1" },
//           room: {
//             $: { runno: "0" },
//             roomTypeCode: booking.roomInfo.roomTypeCode,
//             selectedRateBasis: booking.roomInfo.rateBasisId,
//             adultsCode: booking.adults,
//             passengerName: {
//               firstName: booking.guestDetails.firstName,
//               lastName: booking.guestDetails.lastName
//             }
//           }
//         },
//         productId: booking.hotelInfo.hotelId 
//       }
//     };

  
//     const supplierRes = await SupplierService.callWebBeds('confirmbooking', supplierPayload);


//     if (true) { 
//       await stripe.paymentIntents.capture(paymentIntent.id);
      
//       //when live, replace "MOCK-REF-12345" with actual reference from supplierRes
//       const realRef = supplierRes?.result?.bookingReference || "MOCK-REF-12345";

//       await booking.updateOne({ 
//         status: 'Confirmed', 
//         paymentStatus: 'Captured',
//         supplierReference: realRef 
//       });
//       console.log("🚀 SUCCESS: Booking Confirmed and Payment Captured!");
//     }
//   } catch (error) {
 
//     await stripe.paymentIntents.cancel(paymentIntent.id);
//     await booking.updateOne({ status: 'Failed', paymentStatus: 'Cancelled' });
//     console.error("❌ Booking Process Error. Transaction Rolled Back.");
//   }
// }











//   }

//   res.json({ received: true });
// };

import { Request, Response } from 'express';
import { stripe } from '../utils/stripeClient';
import config from '../config';
import { SupplierService } from '../modules/Supplier/supplier.service';
import { BookingModel } from '../modules/Booking/booking.model';

export const stripeWebhookHandler = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, config.webhook_secret_key!);
  } catch (err: any) {
    console.log("❌ Webhook Signature Error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("🔔 Received Event:", event.type);


  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    console.log("📁 Updating Session ID to PaymentIntent ID...");
    await BookingModel.findOneAndUpdate(
      { paymentIntentId: session.id },
      { paymentIntentId: session.payment_intent, paymentStatus: 'Authorized' }
    );
  }


  if (event.type === 'payment_intent.amount_capturable_updated') {
    const paymentIntent = event.data.object as any;
    const piId = paymentIntent.id;


    let booking = await BookingModel.findOne({ paymentIntentId: piId });

  
    if (!booking) {
        console.log("⏳ Waiting for DB update...");
        await new Promise(resolve => setTimeout(resolve, 1500));
        booking = await BookingModel.findOne({ paymentIntentId: piId });
    }

    if (booking && booking.status === 'Pending') {
      console.log("💰 Money Authorized! Calling WebBeds for Hotel:", booking.hotelInfo.hotelName);

      try {
        const supplierPayload = {
          bookingDetails: {
            fromDate: booking.checkIn,
            toDate: booking.checkOut,
            currency: config.dotw.currency,
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
            productId: booking.hotelInfo.hotelId 
          }
        };

        const supplierRes = await SupplierService.callWebBeds('confirmbooking', supplierPayload);

  
        if (true) { 
          await stripe.paymentIntents.capture(piId);
          const realRef = supplierRes?.result?.bookingReference || "MOCK-REF-12345";

          await booking.updateOne({ 
            status: 'Confirmed', 
            paymentStatus: 'Captured',
            supplierReference: realRef 
          });
          console.log("🚀 SUCCESS: Booking Confirmed and Payment Captured!");
        }
      } catch (error) {
        await stripe.paymentIntents.cancel(piId);
        await booking.updateOne({ status: 'Failed', paymentStatus: 'Cancelled' });
        console.error("❌ Supplier Booking Failed. Transaction Rolled Back.");
      }
    } else {
        console.log("⚠️ Booking already processed or not found.");
    }
  }

  res.json({ received: true });
};