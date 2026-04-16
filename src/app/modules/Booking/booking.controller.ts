import { Request, Response } from 'express';

import sendResponse from '../../utils/sendResponse';

import httpStatus from 'http-status';
import { BookingService } from './booking.services';
import catchAsync from '../../utils/catchAsync';


const createBooking = catchAsync(async (req: Request, res: Response) => {
const userId = req.user.userId;
  const payload = {
    ...req.body,
    user: userId 
  };

  const result = await BookingService.initiateBookingInDB(payload, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking initiated. Please authorize payment.',
    data: result,
  });
});

export const BookingControllers = { createBooking };