
export type THotelSearchRequest = {
  cityCode: string;
  fromDate: string;
  toDate: string;
  adults: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: string;
};

export type THotelDetailsRequest = {
  hotelId: string;
  fromDate: string;
  toDate: string;
  adults: string;
};
export type TRoomRequest = {
  hotelId: string;
  fromDate: string;
  toDate: string;
  adults: string;
};
export interface TFeaturedHotel {
  hotelId: string;
  name: string;
  cityName: string;
  location: string; // Address
  description: string;
  price: string;
  image: string;
  rating: string;
  propertyType: string; // e.g., "5-Star Hotel"
  isFeatured: boolean;
}