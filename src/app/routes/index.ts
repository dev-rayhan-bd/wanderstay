import { Router } from 'express';
import { AuthRoutes } from '../modules/Auth/auth.routes';
import { HotelRoutes } from '../modules/Hotel/hotel.routes';
import { DestinationRoutes } from '../modules/Destination/destination.routess';
import { BookingRoutes } from '../modules/Booking/booking.routes';






const router = Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/hotels',
    route: HotelRoutes,
  },
 {
    path: '/sync',
    route: DestinationRoutes,
  },
 {
    path: '/bookings',
    route: BookingRoutes,
  },

];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
