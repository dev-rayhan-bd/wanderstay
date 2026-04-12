import config from '../../config';
import { SupplierService } from '../Supplier/supplier.service';
import { THotelSearchRequest, TRoomRequest } from './hotel.interface';

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
        price = Math.ceil(parseFloat(hotel.rooms?.room?.roomType?.rateBases?.rateBasis?.total)).toString();
    } catch(e) {}

    return {
      id: attrs.hotelid || hotel.hotelid,
      name: attrs.hotelName || hotel.hotelName || "Luxury Stay",
      city: attrs.cityName || hotel.cityName,
      location: attrs.address || hotel.address,
      rating: attrs.rating || hotel.rating || "4.0",
      image: imageUrl,
      price: price
    };
  });
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
    return rateBases.map((rb: any) => ({
      roomTypeCode: rt.roomtypecode,
      name: rt.name,
      price: Math.ceil(parseFloat(rb.total?._ || rb.total)).toString(),
      mealPlan: rb.description || "Room Only",
      rateBasisId: rb.id 
    }));
  }).flat();
};

export const HotelService = { searchHotels, getRooms };