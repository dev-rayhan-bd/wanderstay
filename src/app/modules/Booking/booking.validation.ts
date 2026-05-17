import { z } from 'zod';

const createBookingZodSchema = z.object({
  guestDetails: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
  }),
  hotelInfo: z.object({
    hotelId: z.string(),
    hotelName: z.string(),
    city: z.string(),
  }),
  roomInfo: z.object({
    roomTypeCode: z.string(),
    rateBasisId: z.string(),
    roomName: z.string(),
    mealPlan: z.string(),
    allocationDetails: z.string().optional(), // ✅ ADD THIS
  }),
  checkIn: z.string(),
  checkOut: z.string(),
  adults: z.number(),
  totalAmount: z.number(),
  childrenAges: z.array(z.number()).optional(), // ✅ ADD THIS
});

export const BookingValidations = { createBookingZodSchema };