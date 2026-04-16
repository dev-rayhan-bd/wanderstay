import express from 'express';
import validateRequest from '../../middleware/validateRequest';
import { BookingControllers } from './booking.controller';
import { BookingValidations } from './booking.validation';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../Auth/auth.constant';

const router = express.Router();

router.post(
  '/initiate',
  validateRequest(BookingValidations.createBookingZodSchema),
    auth(USER_ROLE.user),
  BookingControllers.createBooking
);

export const BookingRoutes = router;