import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { SupplierService } from "../Supplier/supplier.service";
import sendResponse from "../../utils/sendResponse";
import config from "../../config";

// src/app/modules/Hotel/hotel.controller.ts

const searchHotels = catchAsync(async (req: Request, res: Response) => {
  const { cityCode, fromDate, toDate, adults } = req.body;

  const searchDetails = {
    bookingDetails: {
      fromDate,
      toDate,
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

  const response = await SupplierService.callWebBeds(
    "searchhotels",
    searchDetails,
  );

  const rawHotels = response.result?.hotels?.hotel;
  const hotelList = rawHotels
    ? Array.isArray(rawHotels)
      ? rawHotels
      : [rawHotels]
    : [];

  const formattedHotels = hotelList.map((hotel: any) => {
    const hotelId = hotel.hotelCode || hotel.hotelId || hotel.productId;

    let imageUrl =
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000";
    if (hotel.hotelImages?.hotelImage) {
      const img = hotel.hotelImages.hotelImage;
      imageUrl = Array.isArray(img) ? img[0].url : img.url || imageUrl;
    }

    return {
      id: hotelId,
      name: hotel.hotelName || "Luxury Hotel",
      city: hotel.cityName || "",
      location: hotel.address || "Location detail not available",
      rating: hotel.rating || "4.0",
      image: imageUrl,
      description:
        hotel.description1 ||
        "Experience world-class service and premium amenities.",
      price: hotel.price || "450",
      distance: hotel.distance || "0.8km to center",
      propertyType: hotel.propertyType || "Hotel",
      tag: parseFloat(hotel.rating) >= 4.5 ? "Top Rated" : "Best Seller",
      amenities: ["Free Wi-Fi", "Pool", "Spa"],
    };
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: formattedHotels.length > 0 ? "Hotels found" : "No inventory found",
    data: formattedHotels,
  });
});

const getHotelRooms = catchAsync(async (req: Request, res: Response) => {
  const { hotelId, fromDate, toDate, adults } = req.body;

  const roomRequestDetails = {
    bookingDetails: {
      fromDate,
      toDate,
      currency: config.dotw.currency,
      productId: hotelId,
      rooms: {
        $: { no: "1" },
        room: {
          $: { runno: "0" },
          adultsCode: adults || "2",
          children: { $: { no: "0" } },
          rateBasis: "-1",
        },
      },
    },
  };

  const response = await SupplierService.callWebBeds(
    "getrooms",
    roomRequestDetails,
  );

  if (response.result?.request?.successful === "FALSE") {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message:
        "Supplier Error: " +
        (response.result.request.error.details || "Failed to fetch rooms"),
      data: response.result.request.error,
    });
  }

  const hotelData = response.result?.hotels?.hotel;
  const rawRooms = hotelData?.rooms?.room;
  const roomList = rawRooms
    ? Array.isArray(rawRooms)
      ? rawRooms
      : [rawRooms]
    : [];

  const formattedRooms = roomList.map((room: any) => ({
    roomId: room.roomTypeCode,
    name: room.roomType || "Standard Room",
    price: room.price || "150",
    mealPlan: room.mealPlan || "Room Only",
    inclusions: room.amenities || ["Free Wi-Fi", "Air Conditioning"],
    cancellationPolicy: room.cancellationDetails || "Refundable",
    availability: "Available",
  }));

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Rooms fetched successfully",
    data: {
      hotelName: hotelData?.hotelName,
      address: hotelData?.address,
      rating: hotelData?.rating,
      rooms: formattedRooms,
    },
  });
});

export const HotelControllers = { searchHotels, getHotelRooms };
