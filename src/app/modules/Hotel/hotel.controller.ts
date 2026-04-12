import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { SupplierService } from "../Supplier/supplier.service";
import sendResponse from "../../utils/sendResponse";
import config from "../../config";


const searchHotels = catchAsync(async (req: Request, res: Response) => {
  const { cityCode, fromDate, toDate, adults } = req.body;

  const searchDetails = {
    bookingDetails: {
      fromDate, toDate,
      currency: config.dotw.currency,
      rooms: {
        $: { no: "1" },
        room: {
          $: { runno: "0" },
          adultsCode: adults || "2",
          children: { $: { no: "0" } },
          rateBasis: "-1",
          passengerNationality: "1",
          passengerCountryOfResidence: "1",
        },
      },
    },
    return: {
      filters: { city: cityCode },
      resultsPerPage: "20",
      page: "1",
    },
  };

  const response = await SupplierService.callWebBeds("searchhotels", searchDetails);
  const rawHotels = response.result?.hotels?.hotel;
  const hotelList = rawHotels ? (Array.isArray(rawHotels) ? rawHotels : [rawHotels]) : [];

  const formattedHotels = hotelList.map((hotel: any) => {
  // ১. আইডি বের করা (সাপ্লায়ারের 'hotelid' অনুযায়ী)
  const hotelId = hotel.hotelid || (hotel.$ && hotel.$.hotelid);

  // ২. নাম এবং রেটিং বের করা (এগুলো সাপ্লায়ারের attributes '$' এ থাকে)
  const hotelName = (hotel.$ && hotel.$.hotelName) || hotel.hotelName || "Luxury Stay";
  const rating = (hotel.$ && hotel.$.rating) || "4.0";
  const cityName = (hotel.$ && hotel.$.cityName) || "Tirana";
  const address = (hotel.$ && hotel.$.address) || "City Center";

  // ৩. দাম বের করা (আপনার দেওয়া raw ডাটা অনুযায়ী গভীর থেকে বের করা)
  let price = "450"; // ডিফল্ট
  try {
    const room = hotel.rooms?.room;
    // সাপ্লায়ারের ডাটা অনুযায়ী নেস্টেড পাথ চেক করা
    const rateBasis = room?.roomType?.rateBases?.rateBasis;
    if (rateBasis && rateBasis.total) {
      price = Math.ceil(parseFloat(rateBasis.total)).toString();
    }
  } catch (err) {
    console.log("Price extraction failed for hotel:", hotelId);
  }

  // ৪. ইমেজ বের করা
  let imageUrl = "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000";
  if (hotel.hotelImages?.hotelImage) {
    const imgData = Array.isArray(hotel.hotelImages.hotelImage) ? hotel.hotelImages.hotelImage[0] : hotel.hotelImages.hotelImage;
    imageUrl = imgData.url || (imgData.$ && imgData.$.url) || imageUrl;
  }

  return {
    id: hotelId,
    name: hotelName,
    city: cityName,
    location: address,
    rating: rating.toString(),
    image: imageUrl,
    description: "Premium accommodation with world-class facilities.",
    price: price, // এখন আসল দাম আসবে
    distance: "0.5km to center",
    propertyType: "Hotel",
    tag: parseFloat(rating.toString()) >= 4.5 ? "Top Rated" : "Best Seller",
    amenities: ["Free Wi-Fi", "Pool", "Spa"]
  };
});

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: formattedHotels.length > 0 ? "Hotels found" : "No inventory found",
    // ডিব্যাগ করার জন্য সাপ্লায়ারের পাঠানো প্রথম হোটেলটির আসল রূপ এখানে পাঠাচ্ছি
    data: {
      formatted: formattedHotels,
      raw_example_from_supplier: hotelList[0] // এটি দেখে আমরা বুঝতে পারবো আসল কী (Key) নাম কী
    },
  });
});




// src/app/modules/Hotel/hotel.controller.ts -> getHotelRooms ফাংশন
// src/app/modules/Hotel/hotel.controller.ts

const getHotelRooms = catchAsync(async (req: Request, res: Response) => {
  const { hotelId, fromDate, toDate, adults } = req.body;

  const roomRequestDetails = {
    bookingDetails: {
      fromDate, toDate,
      currency: config.dotw.currency,
      rooms: {
        $: { no: "1" },
        room: {
          $: { runno: "0" },
          adultsCode: adults || "2",
          children: { $: { no: "0" } },
          rateBasis: "-1",
          passengerNationality: "1",
          passengerCountryOfResidence: "1"
        }
      },
      productId: hotelId 
    }
  };

  const response = await SupplierService.callWebBeds('getrooms', roomRequestDetails);

if (response.result?.successful === "FALSE") {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "Supplier Error: " + (response.result?.error?.details || "Failed to fetch rooms"),
      data: response.result?.error || null, // এখানে data অ্যাড করা হয়েছে
    });
  }

  const hotelData = response.result?.hotel;
  // সাপ্লায়ারের ডাটা অনুযায়ী রুম টাইপগুলো বের করা
  const rawRoomTypes = hotelData?.rooms?.room?.roomType;
  const roomTypeList = Array.isArray(rawRoomTypes) ? rawRoomTypes : (rawRoomTypes ? [rawRoomTypes] : []);

  const formattedRooms = roomTypeList.map((rt: any) => {
    // রেট বেসিস (দাম এবং খাবার) বের করা
    const rawRateBases = rt.rateBases?.rateBasis;
    const rateBasesList = Array.isArray(rawRateBases) ? rawRateBases : (rawRateBases ? [rawRateBases] : []);

    // প্রতিটি রুম টাইপের জন্য আলাদা আলাদা রেট অপশন ম্যাপ করা
    return rateBasesList.map((rb: any) => {
      // টোটাল প্রাইজ এক্সট্র্যাক্ট করা
      const totalPrice = rb.total?._ || rb.total || "0";
      
      return {
        roomTypeCode: rt.roomtypecode,
        name: rt.name,
        price: Math.ceil(parseFloat(totalPrice)).toString(),
        currency: "USD",
        mealPlan: rb.description || "Room Only",
        maxAdults: rt.roomInfo?.maxAdult || "2",
        leftToSell: rb.leftToSell || "N/A",
        isBookable: rb.isBookable,
        // বুকিং করার জন্য এই আইডিটি লাগবে
        rateBasisId: rb.id 
      };
    });
  }).flat(); // nested array কে flat করে একটি সুন্দর লিস্ট বানানো

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `${formattedRooms.length} Room options found`,
    data: {
      hotelId: hotelData.id,
      hotelName: hotelData.name,
      rooms: formattedRooms
    }
  });
});

export const HotelControllers = { searchHotels, getHotelRooms };
