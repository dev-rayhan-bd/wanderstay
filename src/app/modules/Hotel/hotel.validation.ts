import { z } from 'zod';



const hotelSearchSchema = z.object({
  cityCode: z.string().min(1, "City code is required"),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
  adults: z.string().optional(),
});

const hotelGetRoomsSchema = z.object({
  hotelId: z.string().min(1, "Hotel ID is required"),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
  adults: z.string().optional(),
});




export const HotelValidation = { hotelSearchSchema, hotelGetRoomsSchema };