import { z } from 'zod';

const createBookingZodSchema = z.object({
  body: z.object({
    guestDetails: z.object({
      firstName: z.string().min(1, 'First name is required'),
      lastName: z.string().min(1, 'Last name is required'),
      email: z.string().email('Invalid email'),
      phone: z.string().min(1, 'Phone is required'),
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
    }),
    checkIn: z.string(),
    checkOut: z.string(),
    adults: z.number(),
    totalAmount: z.number(),
  }),
});

export const BookingValidations = { createBookingZodSchema };