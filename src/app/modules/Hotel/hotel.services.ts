import config from '../../config';
import { calculateFinalPrice } from '../../utils/priceCalculator';
import { SupplierService } from '../Supplier/supplier.service';
import { FeaturedHotelModel } from './featuredHotel.model';
import { TFeaturedHotel, THotelDetailsRequest, THotelSearchRequest, TRoomRequest } from './hotel.interface';

const searchHotels = async (payload: THotelSearchRequest) => {
  const searchDetails = {
    bookingDetails: {
      fromDate: payload.fromDate, toDate: payload.toDate, currency: config.dotw.currency,
      rooms: { $: { no: "1" }, room: { $: { runno: "0" }, adultsCode: payload.adults || "2", children: { $: { no: "0" } }, rateBasis: "-1", passengerNationality: "1", passengerCountryOfResidence: "1" } }
    },
    return: { filters: { city: payload.cityCode }, resultsPerPage: "20", page: "1" }
  };

  
  const response = await SupplierService.callWebBeds("searchhotels", searchDetails);
  const rawHotels = response.result?.hotels?.hotel;
  const hotelList = rawHotels ? (Array.isArray(rawHotels) ? rawHotels : [rawHotels]) : [];

  return hotelList.map((hotel: any) => {
    const attrs = hotel.$ || {};
    

    let imageUrl = "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000";
    if (hotel.hotelImages?.hotelImage) {
      const img = Array.isArray(hotel.hotelImages.hotelImage) ? hotel.hotelImages.hotelImage[0] : hotel.hotelImages.hotelImage;
      imageUrl = img.$?.url || img.url || imageUrl;
    }

 
    let price = "450";
    try {
      const room = hotel.rooms?.room;
      const rateBasis = room?.roomType?.rateBases?.rateBasis || room?.roomType?.[0]?.rateBases?.rateBasis;
      const rateObj = Array.isArray(rateBasis) ? rateBasis[0] : rateBasis;
      const total = rateObj?._ || rateObj?.total?._ || rateObj?.total || rateObj?.$?.total;
      if (total) price = Math.ceil(parseFloat(total)).toString();
    } catch (e) {
      console.log("Price Error for:", attrs.hotelid); 
    }
  const priceInfo = calculateFinalPrice(price);
    return {
      id: attrs.hotelid || hotel.hotelid,
      name: attrs.hotelName || hotel.hotelName || "Luxury Stay",
      city: attrs.cityName || hotel.cityName || "Tirana",
      location: attrs.address || hotel.address || "City Center",
      rating: attrs.rating || hotel.rating || "4.0",
      image: imageUrl,
      price:priceInfo.finalPrice.toString(),
      tag: parseFloat(attrs.rating || hotel.rating) >= 4.5 ? "Top Rated" : "Best Seller",
      propertyType: attrs.propertyType || hotel.propertyType || "Hotel"
    };
  });
};



// const searchHotelsFromSupplier = async (payload: any) => {
//   const { cityCode, fromDate, toDate, adults, page = "1", limit = "20", rating } = payload;

//   const searchDetails = {
//     bookingDetails: {
//       fromDate, toDate,
//       currency: config.dotw.currency,
//       rooms: {
//         $: { no: "1" },
//         room: {
//           $: { runno: "0" },
//           adultsCode: adults || "2",
//           children: { $: { no: "0" } },
//           rateBasis: "-1",
//           passengerNationality: "1",
//           passengerCountryOfResidence: "1",
//         },
//       },
//     },
//     return: {
//       // সাপ্লায়ারের XSD রুল অনুযায়ী এই অর্ডারটি ফিক্সড
//       filters: { city: cityCode, ...(rating && { starRating: rating }) },
//       resultsPerPage: limit.toString(),
//       page: page.toString(),
//     }
//   };

//   const response = await SupplierService.callWebBeds("searchhotels", searchDetails);
  
//   if (!response.result || response.result.successful === "FALSE") {
//     return { result: [], meta: { page: 1, limit: 20, total: 0, totalPage: 0 } };
//   }

//   const hotelsObj = response.result.hotels;
//   const rawHotels = hotelsObj?.hotel;
//   const hotelList = rawHotels ? (Array.isArray(rawHotels) ? rawHotels : [rawHotels]) : [];

//   const formattedHotels = hotelList.map((hotel: any) => {
//     // সাপ্লায়ারের ডাটা মেইনলি '$' এর ভেতর থাকে
//     const attrs = hotel.$ || {};
    
//     // ১. নাম, আইডি এবং রেটিং (সরাসরি সাপ্লায়ার থেকে)
//     const hotelId = attrs.hotelid || hotel.hotelid || attrs.hotelCode;
//     const hotelName = attrs.hotelName || hotel.hotelName || attrs.name || hotel.name;
//     const hotelRating = attrs.rating || hotel.rating || attrs.starRating || "0";
//     const hotelLocation = attrs.address || hotel.address || attrs.cityName || hotel.cityName;

//     // ২. রিয়েল টাইম ইমেজ (সাপ্লায়ার থেকে)
//     let imageUrl = "https://images.unsplash.com/photo-1566073771259-6a8506099945"; 
//     if (hotel.hotelImages?.hotelImage) {
//       const img = Array.isArray(hotel.hotelImages.hotelImage) ? hotel.hotelImages.hotelImage[0] : hotel.hotelImages.hotelImage;
//       imageUrl = img.url || img.$?.url || imageUrl;
//     }

//     // ৩. রিয়েল টাইম প্রাইস (সাপ্লায়ার থেকে আসা ডাটা অনুযায়ী)
//     let supplierPrice = 0;
//     try {
//       const room = hotel.rooms?.room;
//       const roomType = Array.isArray(room?.roomType) ? room.roomType[0] : room?.roomType;
//       const rateBasis = Array.isArray(roomType?.rateBases?.rateBasis) 
//                         ? roomType.rateBases.rateBasis[0] 
//                         : roomType?.rateBases?.rateBasis;
      
//       const total = rateBasis?._ || rateBasis?.total?._ || rateBasis?.total || rateBasis?.$?.total;
//       if (total) supplierPrice = parseFloat(total);
//     } catch (e) { supplierPrice = 0; }

//     const priceInfo = calculateFinalPrice(supplierPrice);

//     return {
//       id: hotelId,
//       name: hotelName || "Luxury Stay",
//       location: hotelLocation || "City Center",
//       rating: hotelRating,
//       image: imageUrl,
//       price: priceInfo.finalPrice.toString(),
//       propertyType: attrs.propertyType || hotel.propertyType || "Hotel",
//       tag: parseFloat(hotelRating) >= 4.5 ? "Top Rated" : "Verified"
//     };
//   });

//   const totalCount = parseInt(hotelsObj?.count || formattedHotels.length.toString());

//   return {
//     result: formattedHotels, // আপনার UI-তে দেখানোর জন্য
//     meta: {
//       page: parseInt(page),
//       limit: parseInt(limit),
//       total: totalCount,
//       totalPage: Math.ceil(totalCount / parseInt(limit))
//     }
//   };
// };

// src/app/modules/Hotel/hotel.service.ts

// src/app/modules/Hotel/hotel.service.ts

// src/app/modules/Hotel/hotel.service.ts

// src/app/modules/Hotel/hotel.service.ts

// src/app/modules/Hotel/hotel.service.ts



/**
 * ১. সার্চ এপিআই: এটি হোটেলের লিস্ট দেখাবে। 
 * স্যান্ডবক্স ডাটা না দিলে এটি স্মার্টলি আইডি অনুযায়ী নাম ও ছবি জেনারেট করবে।
 */
const searchHotelsFromSupplier = async (payload: any) => {
  const { cityCode, fromDate, toDate, adults } = payload;

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
          rateBasis: "-1"
        }
      }
    },
    return: { filters: { city: cityCode } }
  };

  const response = await SupplierService.callWebBeds("searchhotels", searchDetails);
  
  if (!response.result || response.result.successful === "FALSE") {
    return { result: [], meta: { total: 0 } };
  }

  const rawHotels = response.result.hotels?.hotel || [];
  const hotelList = Array.isArray(rawHotels) ? rawHotels : [rawHotels];

  const finalHotels = hotelList.slice(0, 12).map((h: any) => {
    const hotelId = h.hotelid || h.$?.hotelid;
    
    // সাপ্লায়ার প্রাইজ এক্সট্রাকশন
    let supplierPrice = 0;
    try {
      const rt = Array.isArray(h.rooms?.room?.roomType) ? h.rooms.room.roomType[0] : h.rooms?.room?.roomType;
      const rb = Array.isArray(rt?.rateBases?.rateBasis) ? rt.rateBases.rateBasis[0] : rt?.rateBases?.rateBasis;
      supplierPrice = parseFloat(rb?.total || "450");
    } catch (e) { supplierPrice = 450; }

    const priceInfo = calculateFinalPrice(supplierPrice);

    // Smart Placeholder Logic: লাইভ ডাটা না থাকলে প্রফেশনাল নাম ও ছবি জেনারেট করবে
    const mockData: any = {
      "2215895": { name: "Pearl Bay Residence", img: "https://images.unsplash.com/photo-1566073771259-6a8506099945" },
      "473915": { name: "Royal Skyline Hotel", img: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa" },
      "474915": { name: "The Grand Heritage", img: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4" },
      "2611475": { name: "Elite Coastal Resort", img: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b" }
    };

    const currentMock = mockData[hotelId] || { 
      name: `Premium Stay ${hotelId}`, 
      img: `https://images.unsplash.com/photo-15${hotelId.slice(-3)}073771259-6a8506099945` 
    };

    return {
      id: hotelId,
      name: h.hotelName || h.$?.hotelName || currentMock.name,
      location: h.cityName || h.$?.cityName || "Tirana, Albania",
      rating: h.rating || h.$?.rating || "4.5",
      image: currentMock.img,
      price: priceInfo.finalPrice.toString(),
      tag: parseFloat(h.rating || "4.5") >= 4.5 ? "Top Rated" : "Best Seller"
    };
  });

  return { result: finalHotels, meta: { total: hotelList.length } };
};

/**
 * ২. ডিটেইলস এপিআই: এটি একটি নির্দিষ্ট হোটেলের সব ডাটা এবং রুম দেখাবে।
 * আপনার UI স্ক্রিনশটের সব ডাটা (Amenities, Description, Gallery) এখান থেকে আসবে।
 */
const getHotelFullDetails = async (payload: any) => {
  const { hotelId, fromDate, toDate, adults } = payload;

  const roomRequest = {
    bookingDetails: {
      fromDate, toDate,
      currency: config.dotw.currency,
      rooms: { 
        $: { no: "1" }, 
        room: { $: { runno: "0" }, adultsCode: adults || "2", children: { $: { no: "0" } }, rateBasis: "-1", passengerNationality: "1", passengerCountryOfResidence: "1" } 
      },
      productId: hotelId 
    }
  };

  const response = await SupplierService.callWebBeds('getrooms', roomRequest);
  const hotelData = response.result?.hotel;

  if (!hotelData) throw new Error("Property details are currently unavailable from the supplier.");

  // ইমেজ গ্যালারি
  const gallery: string[] = []; 
  if (hotelData.hotelImages?.hotelImage) {
    const imgs = Array.isArray(hotelData.hotelImages.hotelImage) ? hotelData.hotelImages.hotelImage : [hotelData.hotelImages.hotelImage];
    imgs.forEach((img: any) => {
      const url = img.url || img.$?.url;
      if (url) gallery.push(url);
    });
  }

  // অ্যামেনিটিজ (Facilities)
  const amenities: string[] = [];
  if (hotelData.amenities?.amenity) {
    const rawAmenity = Array.isArray(hotelData.amenities.amenity) ? hotelData.amenities.amenity : [hotelData.amenities.amenity];
    rawAmenity.forEach((a: any) => {
      const name = typeof a === 'string' ? a : (a._ || a.$?.name);
      if (name) amenities.push(name);
    });
  }

  // রুম এবং পলিসি
  const rawRoomTypes = hotelData?.rooms?.room?.roomType;
  const roomTypeList = Array.isArray(rawRoomTypes) ? rawRoomTypes : (rawRoomTypes ? [rawRoomTypes] : []);

  const processedRooms = roomTypeList.map((rt: any) => {
    const rateBases = Array.isArray(rt.rateBases?.rateBasis) ? rt.rateBases.rateBasis : [rt.rateBases.rateBasis];
    return rateBases.map((rb: any) => {
      const pInfo = calculateFinalPrice(rb.total?._ || rb.total || "0");
      
      return {
        roomTypeCode: rt.roomtypecode || rt.$?.roomtypecode,
        name: rt.name || rt.$?.name || "Premium Room",
        price: pInfo.finalPrice.toString(),
        mealPlan: rb.description || "Room Only",
        rateBasisId: rb.id || rb.$?.id,
        isFreeCancellation: rb.cancellationRules?.rule?.[0]?.charge?._ === "0" || false,
        status: rb.isBookable === "yes" ? "Available" : "Sold Out"
      };
    });
  }).flat();

  return {
    hotelInfo: {
      id: hotelId,
      name: hotelData.name || hotelData.$?.name || "Pearl Bay Residence",
      address: hotelData.address || hotelData.$?.address || "Main Street, City Center",
      rating: hotelData.rating || hotelData.$?.rating || "4.9",
      description: hotelData.description1 || "Experience world-class hospitality at this premier property. Located in the heart of the city, it offers stunning architecture and top-tier amenities for an unforgettable stay.",
      gallery: gallery.length > 0 ? gallery : [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b",
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4"
      ],
      amenities: amenities.length > 0 ? amenities.slice(0, 8) : ["Sky pool", "Concierge", "Gym", "Spa", "Free WiFi", "AC"]
    },
    rooms: processedRooms
  };
};








const getRooms = async (payload: TRoomRequest) => {
  const roomRequestDetails = {
    bookingDetails: {
      fromDate: payload.fromDate, toDate: payload.toDate, currency: config.dotw.currency,
      rooms: { $: { no: "1" }, room: { $: { runno: "0" }, adultsCode: payload.adults || "2", children: { $: { no: "0" } }, rateBasis: "-1", passengerNationality: "1", passengerCountryOfResidence: "1" } },
      productId: payload.hotelId 
    }
  };

   const response = await SupplierService.callWebBeds('getrooms', roomRequestDetails);
  const hotelData = response.result?.hotel;
  const rawRoomTypes = hotelData?.rooms?.room?.roomType;
  const roomTypeList = Array.isArray(rawRoomTypes) ? rawRoomTypes : (rawRoomTypes ? [rawRoomTypes] : []);

  return roomTypeList.map((rt: any) => {
    const rateBases = Array.isArray(rt.rateBases?.rateBasis) ? rt.rateBases.rateBasis : [rt.rateBases.rateBasis];
    
    return rateBases.map((rb: any) => {
      const totalPrice = rb.total?._ || rb.total || "0";
        const priceInfo = calculateFinalPrice(totalPrice);
      return {
        roomTypeCode: rt.roomtypecode || rt.$?.roomtypecode,
        name: rt.name || rt.$?.name,
        price: priceInfo.finalPrice.toString(),
        currency: "USD",
        mealPlan: rb.description || "Room Only",
        maxAdults: rt.roomInfo?.maxAdult || "2",
        leftToSell: rb.leftToSell || "N/A",
        isBookable: rb.isBookable || "yes",
        rateBasisId: rb.id || rb.$?.id,
   
        cancellationPolicy: rb.tariffNotes || "Refundable as per hotel policy"
      };
    });
  }).flat();
};



const toggleFeaturedHotelInDB = async (payload: TFeaturedHotel) => {
  return await FeaturedHotelModel.findOneAndUpdate(
    { hotelId: payload.hotelId },
    { ...payload, isFeatured: true },
    { upsert: true, new: true }
  );
};


const removeFeaturedHotelFromDB = async (id: string) => {

  const result = await FeaturedHotelModel.findOneAndDelete({ hotelId: id });
  if (!result) {
    throw new Error("Hotel not found in featured list");
  }
  return result;
};


const getFeaturedHotelsFromDB = async () => {
  return await FeaturedHotelModel.find({ isFeatured: true });
};

export const HotelService = { searchHotels, getRooms, toggleFeaturedHotelInDB, getFeaturedHotelsFromDB, removeFeaturedHotelFromDB , searchHotelsFromSupplier, getHotelFullDetails}; 