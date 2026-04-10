import express from 'express';
import { HotelControllers } from './hotel.controller';

const router = express.Router();

router.post('/search', HotelControllers.searchHotels);
router.post('/get-rooms', HotelControllers.getHotelRooms);
export const HotelRoutes = router;