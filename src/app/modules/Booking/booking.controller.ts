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

const getMyBookings = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId; 
  const result = await BookingService.getMyBookingsFromDB(userId, req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'My Bookings retrieved successfully',
    data: result,
  });
});
const getCancelQuote = catchAsync(async (req: Request, res: Response) => {
  const result = await BookingService.getCancellationQuote(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Cancellation quote retrieved.",
    data: result,
  });
});


const confirmCancel = catchAsync(async (req: Request, res: Response) => {
  const result = await BookingService.confirmCancellationInDB(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Booking cancelled and refund processed.",
    data: result,
  });
});

export const BookingControllers = { createBooking, getMyBookings, getCancelQuote, confirmCancel };
