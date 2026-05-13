import express from 'express';
import validateRequest from '../../middleware/validateRequest';
import { HotelControllers } from './hotel.controller';
import { HotelValidation } from './hotel.validation';
import { USER_ROLE } from '../Auth/auth.constant';
import auth from '../../middleware/auth';

const router = express.Router();

router.post('/search', validateRequest(HotelValidation.hotelSearchSchema), HotelControllers.searchHotels);
router.post('/get-rooms', validateRequest(HotelValidation.hotelGetRoomsSchema), HotelControllers.getHotelRooms);

router.post('/featured-toggle', auth(USER_ROLE.admin, USER_ROLE.superAdmin), HotelControllers.toggleFeatured);


router.get('/featured', HotelControllers.getFeatured);
export const HotelRoutes = router;