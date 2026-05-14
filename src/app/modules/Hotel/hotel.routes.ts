import express from 'express';
import validateRequest from '../../middleware/validateRequest';
import { HotelControllers } from './hotel.controller';
import { HotelValidation } from './hotel.validation';
import { USER_ROLE } from '../Auth/auth.constant';
import auth from '../../middleware/auth';

const router = express.Router();

router.post('/search', validateRequest(HotelValidation.hotelSearchSchema), HotelControllers.searchHotels);
router.post('/get-rooms', validateRequest(HotelValidation.hotelGetRoomsSchema), HotelControllers.getHotelRooms);

// admin actions
router.post('/featured', auth(USER_ROLE.admin,USER_ROLE.superAdmin), HotelControllers.toggleFeatured);
router.delete('/featured/:id', auth(USER_ROLE.admin,USER_ROLE.superAdmin), HotelControllers.removeFeatured);

// public route to get featured hotels for home page
router.get('/featured', HotelControllers.getFeatured);
router.post('/supplier/search', HotelControllers.searchHotelsFromSupplier);
router.post(
  '/details', 
  validateRequest(HotelValidation.hotelGetRoomsSchema), // hotelId, fromDate, toDate
  HotelControllers.getHotelFullDetails
);

export const HotelRoutes = router;