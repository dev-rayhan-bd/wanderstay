import express from 'express';
import validateRequest from '../../middleware/validateRequest';
import { HotelControllers } from './hotel.controller';
import { HotelValidation } from './hotel.validation';

const router = express.Router();

router.post('/search', validateRequest(HotelValidation.hotelSearchSchema), HotelControllers.searchHotels);
router.post('/get-rooms', validateRequest(HotelValidation.hotelGetRoomsSchema), HotelControllers.getHotelRooms);

export const HotelRoutes = router;