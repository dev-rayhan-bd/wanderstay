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

router.get(
  '/my-bookings',
  auth(USER_ROLE.user, USER_ROLE.admin, USER_ROLE.superAdmin),
  BookingControllers.getMyBookings
);
//when user click cancel booking
router.get(
  '/cancel-quote/:id',
  auth(USER_ROLE.user, USER_ROLE.admin),
  BookingControllers.getCancelQuote
);

//if user click confirm cancel after seeing quote "If you cancel now, a penalty of $50 will apply. You will get $260 back. Proceed?"
router.post(
  '/cancel-confirm/:id',
  auth(USER_ROLE.user, USER_ROLE.admin),
  BookingControllers.confirmCancel
);

export const BookingRoutes = router;