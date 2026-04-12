export type THotelSearchRequest = {
  cityCode: string;
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