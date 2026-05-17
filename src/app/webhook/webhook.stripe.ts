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
// Helper: XML escape
// ─────────────────────────────────────────────
function escapeXml(v: any) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ─────────────────────────────────────────────
// Helper: build <children> node for getrooms
// payload (xml2js object format)
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

// ─────────────────────────────────────────────────────────────────────────────
// extractAllocationDetails
// Returns allocationDetails token + WebBeds-adjusted occupancy.
// changedOccupancy format: "adults,children,extrabedadults,extrabedchildren"
// e.g. "3,0,,1" = 3 adults, 0 children, 0 extraBedAdults, 1 extraBedChild
// ─────────────────────────────────────────────────────────────────────────────
function extractAllocationDetails(
  result: any,
  roomTypeCode: string,
  rateBasisId: string,
  savedAllocationDetails?: string
): { allocationDetails: string; adultsCode: number; extraBeds: number } | null {
  const room = result?.hotel?.rooms?.room;
  if (!room) return null;

  const roomTypes = toArray(room.roomType);

  for (const roomType of roomTypes) {
    const code = roomType.roomtypecode ?? roomType.$?.roomtypecode;
    if (String(code) !== String(roomTypeCode)) continue;

    const rateBases = toArray(roomType.rateBases?.rateBasis);

    // Filter by rateBasisId
    const matchingRateBases = rateBases.filter(
      (rb: any) => String(rb.id ?? rb.$?.id) === String(rateBasisId)
    );
    const pool = matchingRateBases.length > 0 ? matchingRateBases : rateBases;

    // 1st priority: exact allocationDetails match
    let targetRb: any = null;
    if (savedAllocationDetails) {
      targetRb = pool.find(
        (rb: any) => String(rb.allocationDetails) === String(savedAllocationDetails)
      );
    }

    // 2nd priority: first available
    if (!targetRb) {
      targetRb = pool.find((rb: any) => rb.allocationDetails);
    }

    if (!targetRb) continue;

    // Read WebBeds-adjusted occupancy
    let adultsCode = 0;
    let extraBeds  = 0;

    if (targetRb.changedOccupancy) {
      const parts   = String(targetRb.changedOccupancy).split(',');
      adultsCode    = parseInt(parts[0]) || 0;
      const ebAdults   = parseInt(parts[2]) || 0;
      const ebChildren = parseInt(parts[3]) || 0;
      extraBeds = ebAdults + ebChildren;
    } else if (targetRb.validForOccupancy) {
      adultsCode = parseInt(targetRb.validForOccupancy.adults)   || 0;
      extraBeds  = parseInt(targetRb.validForOccupancy.extraBed) || 0;
    }

    return {
      allocationDetails: targetRb.allocationDetails,
      adultsCode,
      extraBeds,
    };
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// callConfirmBooking — manual XSD-compliant XML
// No <language> tag (confirmbooking_hotel.xsd forbids it)
// Uses WebBeds-adjusted adultsCode + extraBeds from extractAllocationDetails
// ─────────────────────────────────────────────────────────────────────────────
async function callConfirmBooking(
  b: any,
  allocationDetails: string,
  finalAdultsCode: number,
  extraBeds: number
): Promise<any> {
  const childCount = b.childrenAges?.length || 0;
  let childrenXml = childCount > 0 
    ? `<children no="${childCount}">${b.childrenAges.map((age: number, idx: number) => `<child runno="${idx}">${age}</child>`).join('')}</children>`
    : `<children no="0"/>`;


  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<customer>
  <username>${escapeXml(config.dotw.username)}</username>
  <password>${escapeXml(config.dotw.password)}</password>
  <id>${escapeXml(config.dotw.id)}</id>
  <source>1</source>
  <product>hotel</product>
  <request command="confirmbooking">
    <bookingDetails>
      <fromDate>${escapeXml(b.checkIn)}</fromDate>
      <toDate>${escapeXml(b.checkOut)}</toDate>
      <currency>${escapeXml(config.dotw.currency)}</currency>
      <rooms no="1">
        <room runno="0">
          <adultsCode>${escapeXml(finalAdultsCode)}</adultsCode>
          ${childrenXml}
          <passengerName>
            <firstName>${escapeXml(b.guestDetails.firstName)}</firstName>
            <lastName>${escapeXml(b.guestDetails.lastName)}</lastName>
          </passengerName>
          <passengerNationality>1</passengerNationality>
          <passengerCountryOfResidence>1</passengerCountryOfResidence>
          <roomTypeCode>${escapeXml(b.roomInfo.roomTypeCode)}</roomTypeCode>
          <selectedRateBasis>${escapeXml(b.roomInfo.rateBasisId)}</selectedRateBasis>
          <allocationDetails>${escapeXml(allocationDetails)}</allocationDetails>
        </room>
      </rooms>
      <productId>${escapeXml(b.hotelInfo.hotelId)}</productId>
    </bookingDetails>
  </request>
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
    ignoreAttrs:   false,
    mergeAttrs:    true,
  });

  return parsed;
}
// async function callConfirmBooking(
//   b: any,
//   allocationDetails: string,
//   finalAdultsCode: number,
//   extraBeds: number
// ): Promise<any> {
//   const childCount = b.childrenAges?.length || 0;

//   // Build <children> block
//   let childrenXml = '';
//   if (childCount > 0) {
//     const childTags = b.childrenAges
//       .map((age: number, idx: number) => `<child runno="${idx}">${age}</child>`)
//       .join('');
//     childrenXml = `<children no="${childCount}">${childTags}</children>`;
//   } else {
//     childrenXml = `<children no="0"/>`;
//   }

//   // ✅ XSD requires singular <extraBed no="N"/> NOT <extraBeds>
// const extraBedXml = extraBeds > 0
//   ? `<extraBed>${extraBeds}</extraBed>`
//   : '';

//   const xml = `<?xml version="1.0" encoding="UTF-8"?>
// <customer>
//   <username>${escapeXml(config.dotw.username)}</username>
//   <password>${escapeXml(config.dotw.password)}</password>
//   <id>${escapeXml(config.dotw.id)}</id>
//   <source>1</source>
//   <product>hotel</product>

//   <request command="confirmbooking">
//     <bookingDetails>
//       <fromDate>${escapeXml(b.checkIn)}</fromDate>
//       <toDate>${escapeXml(b.checkOut)}</toDate>
//       <currency>${escapeXml(config.dotw.currency)}</currency>
//       <productId>${escapeXml(b.hotelInfo.hotelId)}</productId>

//       <rooms no="1">
//         <room runno="0">
//           <roomTypeCode>${escapeXml(b.roomInfo.roomTypeCode)}</roomTypeCode>
//           <selectedRateBasis>${escapeXml(b.roomInfo.rateBasisId)}</selectedRateBasis>
//           <allocationDetails>${escapeXml(allocationDetails)}</allocationDetails>

//           <adultsCode>${escapeXml(finalAdultsCode)}</adultsCode>
//           <actualAdults>${escapeXml(finalAdultsCode)}</actualAdults>
//           ${childrenXml}
//           <actualChildren no="${childCount}"/>
//           ${extraBedXml}

//           <passengerNationality>1</passengerNationality>
//           <passengerCountryOfResidence>1</passengerCountryOfResidence>

//           <passengersDetails>
//             <passenger>
//               <salutation>1</salutation>
//               <firstName>${escapeXml(b.guestDetails.firstName)}</firstName>
//               <lastName>${escapeXml(b.guestDetails.lastName)}</lastName>
//             </passenger>
//           </passengersDetails>
//         </room>
//       </rooms>
//     </bookingDetails>
//   </request>
// </customer>`;

//   console.log('\n========== [XML REQUEST: confirmbooking (manual)] ==========');
//   console.log(xml);
//   console.log('====================================================\n');

//   const response = await axios.post(config.dotw.url!, xml, {
//     headers: { 'Content-Type': 'text/xml' },
//   });

//   console.log('\n========== [XML RESPONSE: confirmbooking (manual)] ==========');
//   console.log(response.data);
//   console.log('====================================================\n');

//   const parsed = await parseStringPromise(response.data, {
//     explicitArray: false,
//     ignoreAttrs:   false,
//     mergeAttrs:    true,
//   });

//   return parsed;
// }

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
        paymentStatus:   'Authorized',
      }
    );
  }

  // ─────────────────────────────────────────────
  // EVENT 2: payment_intent.amount_capturable_updated
  // Card is held → run WebBeds 2-step booking flow
  // ─────────────────────────────────────────────
  if (event.type === 'payment_intent.amount_capturable_updated') {
    const paymentIntent = event.data.object as any;
    const piId = paymentIntent.id;

    // Retry loop — checkout.session.completed may arrive slightly after
   let booking: any = null;
    for (let attempt = 1; attempt <= 10; attempt++) {
      console.log(`⏳ Attempt ${attempt}: Looking for booking with PI: ${piId}`);
      booking = await BookingModel.findOne({ paymentIntentId: piId });
      if (booking) break;
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    if (!booking) {
      console.log('⚠️ Booking not found after retries for PI:', piId);
      return res.json({ received: true });
    }

    if (booking.status !== 'Pending') {
      console.log(`ℹ️ Booking already processed. Status: ${booking.status}`);
      return res.json({ received: true });
    }

    const b = booking as any;
    console.log(`💰 Money Authorized! Calling WebBeds for Hotel: ${b.hotelInfo.hotelName}`);

    try {

      // ───────────────────────────────────────────────────
      // STEP A: getrooms — get fresh allocationDetails token
      // ───────────────────────────────────────────────────
const getroomsPayload = {
  request: {
    $: { command: 'getrooms' },
    bookingDetails: {
      fromDate: b.checkIn,
      toDate: b.checkOut,
      currency: config.dotw.currency,
      rooms: {
        $: { no: '1' },
        room: {
          $: { runno: '0' },
          adultsCode: b.adults.toString(),
          children: buildChildrenNode(b.childrenAges),
          passengerNationality: '1',
          passengerCountryOfResidence: '1',
          rateBasis: b.roomInfo.rateBasisId,
          roomTypeCode: b.roomInfo.roomTypeCode,
        },
      },
      productId: b.hotelInfo.hotelId,
      roomModified: 0, 
      roomTypeSelected: "yes" // 👈 এটিই সবচেয়ে গুরুত্বপূর্ণ, যা আপনার কোডে ছিল না
    }
  }
};

      console.log('📡 [STEP A] Calling getrooms...');
      const getroomsRes = await SupplierService.callWebBeds('getrooms', getroomsPayload);

      if (getroomsRes.result?.successful !== 'TRUE') {
        const errDetail = getroomsRes.result?.error?.details || 'Unknown error';
        throw new Error(`getrooms failed: ${errDetail}`);
      }

      // ✅ Single call — no duplicate
      const occupancyInfo = extractAllocationDetails(
        getroomsRes.result,
        b.roomInfo.roomTypeCode,
        b.roomInfo.rateBasisId,
        b.roomInfo.allocationDetails
      );

      if (!occupancyInfo) {
        throw new Error(
          `allocationDetails not found for roomTypeCode=${b.roomInfo.roomTypeCode}. Room may no longer be available.`
        );
      }

      // Use WebBeds-adjusted adults count; fall back to original if not changed
      // const finalAdultsCode = occupancyInfo.adultsCode > 0
      //   ? occupancyInfo.adultsCode
      //   : b.adults;
const finalAdultsCode = b.adults;
      console.log(`🔑 Allocation: ${occupancyInfo.allocationDetails} | Adults: ${finalAdultsCode} | ExtraBeds: ${occupancyInfo.extraBeds}`);

      // ───────────────────────────────────────────────────
      // STEP B: confirmbooking
      // ───────────────────────────────────────────────────
      console.log('📋 [STEP B] Calling confirmbooking...');
      const confirmParsed = await callConfirmBooking(
        b,
        occupancyInfo.allocationDetails,
        finalAdultsCode,
        occupancyInfo.extraBeds
      );

      console.log('📨 confirmbooking raw result:', JSON.stringify(confirmParsed?.result, null, 2));

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

      // ───────────────────────────────────────────────────
      // SUCCESS — capture card & save booking
      // ───────────────────────────────────────────────────
      await stripe.paymentIntents.capture(piId);

      const supplierRef =
        confirmResult?.bookingReference ||
        confirmResult?.request?.bookingReference ||
        'REF-SUCCESS';

      await b.updateOne({
        status:            'Confirmed',
        paymentStatus:     'Captured',
        supplierReference: supplierRef,
        allocationDetails: occupancyInfo.allocationDetails,
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