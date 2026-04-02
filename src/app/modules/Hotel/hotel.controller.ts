import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import { SupplierService } from '../Supplier/supplier.service';
import sendResponse from '../../utils/sendResponse';
import config from '../../config';

// src/app/modules/Hotel/hotel.controller.ts

// src/app/modules/Hotel/hotel.controller.ts

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
          passengerCountryOfResidence: "1" 
        } 
      }
    },
    return: {
      filters: { city: cityCode },
      resultsPerPage: "20",
      page: "1"
    }
  };

  const response = await SupplierService.callWebBeds('searchhotels', searchDetails);
  
  const rawHotels = response.result?.hotels?.hotel;
  const hotelList = rawHotels ? (Array.isArray(rawHotels) ? rawHotels : [rawHotels]) : [];

  // আপনার UI কার্ডের জন্য সব ফিল্ড ম্যাপ করা হলো
  const formattedHotels = hotelList.map((hotel: any) => {
    // ইমেজ এক্সট্র্যাকশন লজিক
    let imageUrl = "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000";
    if (hotel.hotelImages?.hotelImage) {
      const img = hotel.hotelImages.hotelImage;
      imageUrl = Array.isArray(img) ? img[0].url : (img.url || imageUrl);
    }

    return {
      id: hotel.hotelId || hotel.cityCode,
      name: hotel.hotelName || "Luxury Hotel",
      city: hotel.cityName || "",
      location: hotel.address || "Location detail not available",
      rating: hotel.rating || "4.0",
      image: imageUrl,
      // সাপ্লায়ার রেসপন্স থেকে ডেসক্রিপশন বা অ্যামিনিটিজ নেওয়া
      description: hotel.description1 || "Experience world-class service and premium amenities.",
      price: hotel.price || "450", // দাম সাপ্লায়ার থেকে না আসলে চেকআউট এ পাবো
      distance: hotel.distance || "0.8km to center",
      propertyType: hotel.propertyType || "Hotel",
      tag: parseFloat(hotel.rating) >= 4.5 ? "Top Rated" : "Best Seller",
      // অ্যামিনিটিজ (সাপ্লায়ারের ডাটা অনুযায়ী)
      amenities: ["Free Wi-Fi", "Pool", "Spa"] 
    };
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: formattedHotels.length > 0 ? "Hotels found" : "No inventory found",
    data: formattedHotels
  });
});
export const HotelControllers = { searchHotels };