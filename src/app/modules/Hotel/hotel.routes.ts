import express from 'express';
import { HotelControllers } from './hotel.controller';

const router = express.Router();

router.post('/search', HotelControllers.searchHotels);

export const HotelRoutes = router;