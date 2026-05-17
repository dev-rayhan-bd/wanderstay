// import { Request, Response } from 'express';
// import { stripe } from '../utils/stripeClient';
// import config from '../config';
// import { SupplierService } from '../modules/Supplier/supplier.service';
// import { BookingModel } from '../modules/Booking/booking.model';
// import { sendBookingEmail } from '../utils/sendEmail';

// export const stripeWebhookHandler = async (req: Request, res: Response) => {
//   const sig = req.headers['stripe-signature'] as string;
//   let event;

//   try {
//     event = stripe.webhooks.constructEvent(req.body, sig, config.webhook_secret_key!);
//   } catch (err: any) {
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   console.log(`🔔 Received Event: ${event.type}`);

//   // Step 1️⃣: Update Session ID → PaymentIntent ID
//   if (event.type === 'checkout.session.completed') {
//     const session = event.data.object as any;
//     console.log("📁 Updating Session ID to PaymentIntent ID...");

//     await BookingModel.findOneAndUpdate(
//       { paymentIntentId: session.id },
//       {
//         paymentIntentId: session.payment_intent,
//         paymentStatus: 'Authorized'
//       }
//     );
//   }

//   // Step 2️⃣: Money Authorized → Block & Confirm Room
//   if (event.type === 'payment_intent.amount_capturable_updated') {
//     const paymentIntent = event.data.object as any;
//     const piId = paymentIntent.id;

//     console.log("⏳ Waiting for DB update...");
//     await new Promise(resolve => setTimeout(resolve, 2000));

//     let booking = await BookingModel.findOne({ paymentIntentId: piId });

//     if (!booking) {
//       console.log("⚠️ Booking not found for PI:", piId);
//       return res.json({ received: true });
//     }

//     if (booking.status !== 'Pending') {
//       console.log(`ℹ️ Booking already processed. Status: ${booking.status}`);
//       return res.json({ received: true });
//     }

//     const b = booking as any;
//     console.log(`💰 Money Authorized! Calling WebBeds for Hotel: ${b.hotelInfo.hotelName}`);

//     try {
//       // 🛡️ STEP A: GET ALLOCATION DETAILS (initial getrooms)
//       const initialPayload = {
//         bookingDetails: {
//           fromDate: b.checkIn,
//           toDate: b.checkOut,
//           currency: config.dotw.currency,
//           rooms: {
//             $: { no: "1" },
//             room: {
//               $: { runno: "0" },
//               adultsCode: b.adults.toString(),
//               children: (b.childrenAges?.length > 0)
//                 ? {
//                     $: { no: b.childrenAges.length.toString() },
//                     child: b.childrenAges.map((age: number, idx: number) => ({
//                       $: { runno: idx.toString() },
//                       _: age.toString()
//                     }))
//                   }
//                 : { $: { no: "0" } },
//               rateBasis: b.roomInfo.rateBasisId,
//               passengerNationality: "1",
//               passengerCountryOfResidence: "1"
//             }
//           },
//           productId: b.hotelInfo.hotelId
//         }
//       };

//       const initialRes = await SupplierService.callWebBeds('getrooms', initialPayload);

//       if (initialRes.result?.successful !== "TRUE") {
//         throw new Error("Initial getrooms failed");
//       }

//       // Extract allocation details from the matching rateBasis
//       const rooms = initialRes.result?.hotel?.rooms?.room;
//       let allocationDetails: string | null = null;

//       // Find the roomType that matches our roomTypeCode
//       const roomTypes = Array.isArray(rooms?.roomType) ? rooms.roomType : [rooms?.roomType];
      
//       for (const roomType of roomTypes) {
//         if (roomType.roomtypecode === b.roomInfo.roomTypeCode) {
//           const rateBases = Array.isArray(roomType.rateBases?.rateBasis) 
//             ? roomType.rateBases.rateBasis 
//             : [roomType.rateBases?.rateBasis];

//           for (const rb of rateBases) {
//             if (rb.id === b.roomInfo.rateBasisId) {
//               allocationDetails = rb.allocationDetails;
//               break;
//             }
//           }
//         }
//         if (allocationDetails) break;
//       }

//       if (!allocationDetails) {
//         throw new Error("Allocation details not found");
//       }

//       console.log(`🔑 Got Allocation Details: ${allocationDetails}`);

//       // 🛡️ STEP B: BLOCK ROOM WITH ALLOCATION DETAILS
//       const blockPayload = {
//         bookingDetails: {
//           fromDate: b.checkIn,
//           toDate: b.checkOut,
//           currency: config.dotw.currency,
//           rooms: {
//             $: { no: "1" },
//             room: {
//               $: { runno: "0" },
//               adultsCode: b.adults.toString(),
//               children: (b.childrenAges?.length > 0)
//                 ? {
//                     $: { no: b.childrenAges.length.toString() },
//                     child: b.childrenAges.map((age: number, idx: number) => ({
//                       $: { runno: idx.toString() },
//                       _: age.toString()
//                     }))
//                   }
//                 : { $: { no: "0" } },
//               rateBasis: b.roomInfo.rateBasisId,
//               passengerNationality: "1",
//               passengerCountryOfResidence: "1",
//               allocationDetails: allocationDetails  // ✅ এটা যোগ করলাম
//             }
//           },
//           productId: b.hotelInfo.hotelId
//         }
//       };

//       const blockCheck = await SupplierService.callWebBeds('getrooms', blockPayload);

//       const blockStatus =
//         blockCheck.result?.hotel?.rooms?.room?.roomType?.rateBases?.rateBasis?.status;

//       if (blockStatus !== "checked") {
//         console.log(`❌ Room Block Failed. Status: ${blockStatus || 'Error'}. Cancelling Payment.`);
//         await stripe.paymentIntents.cancel(piId);
//         await b.updateOne({ status: 'Failed', paymentStatus: 'Cancelled' });
//         return res.json({ received: true });
//       }

//       console.log("✅ Room Blocked Successfully! Proceeding to Confirmation...");

//       // 🛡️ STEP C: CONFIRM BOOKING
//       const confirmPayload = {
//         bookingDetails: {
//           fromDate: b.checkIn,
//           toDate: b.checkOut,
//           currency: config.dotw.currency,
//           rooms: {
//             $: { no: "1" },
//             room: {
//               $: { runno: "0" },
//               adultsCode: b.adults.toString(),
//               children: (b.childrenAges?.length > 0)
//                 ? {
//                     $: { no: b.childrenAges.length.toString() },
//                     child: b.childrenAges.map((age: number, idx: number) => ({
//                       $: { runno: idx.toString() },
//                       _: age.toString()
//                     }))
//                   }
//                 : { $: { no: "0" } },
//               passengerName: {
//                 firstName: b.guestDetails.firstName,
//                 lastName: b.guestDetails.lastName
//               },
//               passengerNationality: "1",
//               passengerCountryOfResidence: "1",
//               selectedRateBasis: b.roomInfo.rateBasisId,
//               allocationDetails: allocationDetails  // ✅ confirm এও লাগবে
//             }
//           },
//           productId: b.hotelInfo.hotelId,
//           roomTypeCode: b.roomInfo.roomTypeCode
//         }
//       };

//       const supplierRes = await SupplierService.callWebBeds('confirmbooking', confirmPayload);

//       if (supplierRes.result?.successful === "TRUE") {
//         await stripe.paymentIntents.capture(piId);
//         const realRef = supplierRes.result.bookingReference || "REF-SUCCESS";

//         await b.updateOne({
//           status: 'Confirmed',
//           paymentStatus: 'Captured',
//           supplierReference: realRef
//         });

//         await sendBookingEmail(b.guestDetails.email, {
//           ...b.toObject(),
//           supplierReference: realRef
//         });

//         console.log(`🚀 SUCCESS: Booking Confirmed! Ref: ${realRef}`);
//       } else {
//         const errMsg = supplierRes.result?.error?.details || "Unknown Error";
//         console.error("❌ Supplier Confirmation Failed:", errMsg);
//         throw new Error(errMsg);
//       }

//     } catch (error: any) {
//       console.error("❌ Webhook Process Error:", error.message);

//       try {
//         await stripe.paymentIntents.cancel(piId);
//         await b.updateOne({
//           status: 'Failed',
//           paymentStatus: 'Cancelled',
//           failureReason: error.message
//         });
//       } catch (rollbackErr) {
//         console.error("❌ Rollback Error:", rollbackErr);
//       }
//     }
//   }

//   res.json({ received: true });
// };
import { Request, Response } from 'express';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { stripe } from '../utils/stripeClient';
import config from '../config';
import { SupplierService } from '../modules/Supplier/supplier.service';
import { BookingModel } from '../modules/Booking/booking.model';
import { sendBookingEmail } from '../utils/sendEmail';

// ─────────────────────────────────────────────
// Helper: safely turn anything into an array
// ─────────────────────────────────────────────
function toArray<T>(val: T | T[] | undefined | null): T[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

// ─────────────────────────────────────────────
// Helper: build <children> XML string
// ─────────────────────────────────────────────
function buildChildrenXml(childrenAges?: number[]): string {
  if (!childrenAges || childrenAges.length === 0) {
    return `<children no="0"/>`;
  }
  const childTags = childrenAges
    .map((age, idx) => `<child runno="${idx}">${age}</child>`)
    .join('');
  return `<children no="${childrenAges.length}">${childTags}</children>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// confirmbooking requires a DIFFERENT XML envelope from all other commands.
// The confirmbooking_hotel.xsd forbids <language> — so we cannot use the
// generic callWebBeds() which always injects <language>en</language>.
// We build and send the XML manually here.
// ─────────────────────────────────────────────────────────────────────────────
async function callConfirmBooking(b: any, allocationDetails: string): Promise<any> {
  const childrenXml = buildChildrenXml(b.childrenAges);

  // ⚠️  NO <language> tag — confirmbooking_hotel.xsd forbids it
  // ⚠️  XSD strict order (confirmed by iterative error messages):
  //     bookingDetails: fromDate → toDate → currency → productId → rooms
  //     room: roomTypeCode → adultsCode → children → passengerName → ...
  const xml = `<?xml version="1.0" encoding="UTF-8"?><customer>\
<username>${config.dotw.username}</username>\
<password>${config.dotw.password}</password>\
<id>${config.dotw.id}</id>\
<source>1</source>\
<product>hotel</product>\
<request command="confirmbooking">\
<bookingDetails>\
<fromDate>${b.checkIn}</fromDate>\
<toDate>${b.checkOut}</toDate>\
<currency>${config.dotw.currency}</currency>\
<productId>${b.hotelInfo.hotelId}</productId>\
<rooms no="1">\
<room runno="0">\
<roomTypeCode>${b.roomInfo.roomTypeCode}</roomTypeCode>\
<adultsCode>${b.adults}</adultsCode>\
${childrenXml}\
<passengerName>\
<firstName>${b.guestDetails.firstName}</firstName>\
<lastName>${b.guestDetails.lastName}</lastName>\
</passengerName>\
<passengerNationality>1</passengerNationality>\
<passengerCountryOfResidence>1</passengerCountryOfResidence>\
<selectedRateBasis>${b.roomInfo.rateBasisId}</selectedRateBasis>\
<allocationDetails>${allocationDetails}</allocationDetails>\
</room>\
</rooms>\
</bookingDetails>\
</request>\
</customer>`;

  console.log('\n========== [XML REQUEST: confirmbooking (manual)] ==========');
  console.log(xml);
  console.log('====================================================\n');

  const response = await axios.post(config.dotw.url!, xml, {
    headers: { 'Content-Type': 'text/xml' },
  });

  console.log('\n========== [XML RESPONSE: confirmbooking (manual)] ==========');
  console.log(response.data);
  console.log('====================================================\n');

  const parsed = await parseStringPromise(response.data, {
    explicitArray: false,
    ignoreAttrs: false,
    mergeAttrs: true,
  });

  return parsed;
}

// ─────────────────────────────────────────────────────────────────────────────
// Extract allocationDetails from getrooms response.
// Matches on roomtypecode, then tries exact match on savedAllocationDetails.
// Falls back to first available token for that roomType.
// ─────────────────────────────────────────────────────────────────────────────
function extractAllocationDetails(
  result: any,
  roomTypeCode: string,
  savedAllocationDetails?: string
): string | null {
  const room = result?.hotel?.rooms?.room;
  if (!room) return null;

  const roomTypes = toArray(room.roomType);

  for (const roomType of roomTypes) {
    const code = roomType.roomtypecode ?? roomType.$?.roomtypecode;
    if (String(code) !== String(roomTypeCode)) continue;

    const rateBases = toArray(roomType.rateBases?.rateBasis);

    // 1st priority: exact match on what the user originally selected
    if (savedAllocationDetails) {
      for (const rb of rateBases) {
        if (rb.allocationDetails && String(rb.allocationDetails) === String(savedAllocationDetails)) {
          return rb.allocationDetails;
        }
      }
    }

    // 2nd priority: first available allocationDetails for this roomType
    for (const rb of rateBases) {
      if (rb.allocationDetails) return rb.allocationDetails;
    }
  }

  return null;
}

// ─────────────────────────────────────────────
// Main webhook handler
// ─────────────────────────────────────────────
export const stripeWebhookHandler = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, config.webhook_secret_key!);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`🔔 Received Event: ${event.type}`);

  // ─────────────────────────────────────────────
  // EVENT 1: checkout.session.completed
  // Swap Stripe Session ID → PaymentIntent ID in DB
  // ─────────────────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    console.log('📁 Updating Session ID to PaymentIntent ID...');

    await BookingModel.findOneAndUpdate(
      { paymentIntentId: session.id },
      {
        paymentIntentId: session.payment_intent,
        paymentStatus: 'Authorized',
      }
    );
  }

  // ─────────────────────────────────────────────
  // EVENT 2: payment_intent.amount_capturable_updated
  // Card is held → run WebBeds 2-step booking flow:
  //   STEP A: getrooms       → get fresh allocationDetails token
  //   STEP B: confirmbooking → manual XML (no <language> tag)
  // ─────────────────────────────────────────────
  if (event.type === 'payment_intent.amount_capturable_updated') {
    const paymentIntent = event.data.object as any;
    const piId = paymentIntent.id;

    console.log('⏳ Waiting for DB update...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const booking = await BookingModel.findOne({ paymentIntentId: piId });

    if (!booking) {
      console.log('⚠️ Booking not found for PI:', piId);
      return res.json({ received: true });
    }

    if (booking.status !== 'Pending') {
      console.log(`ℹ️ Booking already processed. Status: ${booking.status}`);
      return res.json({ received: true });
    }

    const b = booking as any;
    console.log(`💰 Money Authorized! Calling WebBeds for Hotel: ${b.hotelInfo.hotelName}`);

    try {

      // ─────────────────────────────────────────────────────────
      // STEP A: getrooms — get a fresh allocationDetails token
      // DO NOT send allocationDetails in this request (XSD forbids it)
      // ─────────────────────────────────────────────────────────
      const getroomsPayload = {
        bookingDetails: {
          fromDate: b.checkIn,
          toDate:   b.checkOut,
          currency: config.dotw.currency,
          rooms: {
            $: { no: '1' },
            room: {
              $: { runno: '0' },
              adultsCode:                  b.adults.toString(),
              children:                    buildChildrenNode(b.childrenAges),
              rateBasis:                   b.roomInfo.rateBasisId,
              passengerNationality:        '1',
              passengerCountryOfResidence: '1',
            },
          },
          productId: b.hotelInfo.hotelId,
        },
      };

      console.log('📡 [STEP A] Calling getrooms...');
      const getroomsRes = await SupplierService.callWebBeds('getrooms', getroomsPayload);

      if (getroomsRes.result?.successful !== 'TRUE') {
        const errDetail = getroomsRes.result?.error?.details || 'Unknown error';
        throw new Error(`getrooms failed: ${errDetail}`);
      }

      const allocationDetails = extractAllocationDetails(
        getroomsRes.result,
        b.roomInfo.roomTypeCode,
        b.roomInfo.allocationDetails
      );

      if (!allocationDetails) {
        throw new Error(
          `allocationDetails not found for roomTypeCode=${b.roomInfo.roomTypeCode}. Room may no longer be available.`
        );
      }

      console.log(`🔑 Got Allocation Details: ${allocationDetails}`);

      // ─────────────────────────────────────────────────────────
      // STEP B: confirmbooking — sent via manual XML builder
      // because confirmbooking_hotel.xsd forbids <language> tag
      // which callWebBeds() always injects
      // ─────────────────────────────────────────────────────────
      console.log('📋 [STEP B] Calling confirmbooking...');
      const confirmParsed = await callConfirmBooking(b, allocationDetails);

      console.log('📨 confirmbooking raw result:', JSON.stringify(confirmParsed?.result, null, 2));

      // Check success — handle both envelope shapes
      const confirmResult = confirmParsed?.result;
      const isSuccess =
        confirmResult?.successful === 'TRUE' ||
        confirmResult?.request?.successful === 'TRUE';

      if (!isSuccess) {
        const errDetail =
          confirmResult?.error?.details ||
          confirmResult?.request?.error?.details ||
          'confirmbooking rejected by WebBeds';
        throw new Error(`confirmbooking failed: ${errDetail}`);
      }

      // ─────────────────────────────────────────────────────────
      // SUCCESS — capture card & persist booking
      // ─────────────────────────────────────────────────────────
      await stripe.paymentIntents.capture(piId);

      const supplierRef =
        confirmResult?.bookingReference ||
        confirmResult?.request?.bookingReference ||
        'REF-SUCCESS';

      await b.updateOne({
        status:            'Confirmed',
        paymentStatus:     'Captured',
        supplierReference: supplierRef,
        allocationDetails: allocationDetails,
      });

      await sendBookingEmail(b.guestDetails.email, {
        ...b.toObject(),
        supplierReference: supplierRef,
      });

      console.log(`🚀 SUCCESS: Booking Confirmed! Ref: ${supplierRef}`);

    } catch (error: any) {
      console.error('❌ Webhook Process Error:', error.message);

      try {
        await stripe.paymentIntents.cancel(piId);
        await b.updateOne({
          status:        'Failed',
          paymentStatus: 'Cancelled',
          failureReason: error.message,
        });
        console.log('🔄 Payment cancelled & booking marked Failed.');
      } catch (rollbackErr) {
        console.error('❌ Rollback Error:', rollbackErr);
      }
    }
  }

  res.json({ received: true });
};

// ─────────────────────────────────────────────
// Helper for getrooms payload (xml2js object format)
// ─────────────────────────────────────────────
function buildChildrenNode(childrenAges?: number[]) {
  if (!childrenAges || childrenAges.length === 0) {
    return { $: { no: '0' } };
  }
  return {
    $: { no: childrenAges.length.toString() },
    child: childrenAges.map((age: number, idx: number) => ({
      $: { runno: idx.toString() },
      _: age.toString(),
    })),
  };
}