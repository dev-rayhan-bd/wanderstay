import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { HotelService } from "./hotel.services";


const searchHotels = catchAsync(async (req: Request, res: Response) => {
  const result = await HotelService.searchHotels(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Hotels found",
    data: result,
  });
});

const getHotelRooms = catchAsync(async (req: Request, res: Response) => {
  const result = await HotelService.getRooms(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Rooms found",
    data: result,
  });
});

export const HotelControllers = { searchHotels, getHotelRooms };