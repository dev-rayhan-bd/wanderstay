import express from 'express';
import validateRequest from '../../middleware/validateRequest';
import { BookingControllers } from './booking.controller';
import { BookingValidations } from './booking.validation';

const router = express.Router();

router.post(
  '/initiate',
  validateRequest(BookingValidations.createBookingZodSchema),
  BookingControllers.createBooking
);

export const BookingRoutes = router;