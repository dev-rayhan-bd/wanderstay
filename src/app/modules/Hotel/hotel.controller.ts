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

const toggleFeatured = catchAsync(async (req: Request, res: Response) => {
  const result = await HotelService.toggleFeaturedHotelInDB(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Hotel added to featured list",
    data: result,
  });
});


const removeFeatured = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;//hotelId
  const result = await HotelService.removeFeaturedHotelFromDB(id as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Hotel removed from featured list",
    data: result,
  });
});


const getFeatured = catchAsync(async (req: Request, res: Response) => {
  const result = await HotelService.getFeaturedHotelsFromDB();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Featured hotels fetched",
    data: result,
  });
});

const searchHotelsFromSupplier = catchAsync(async (req: Request, res: Response) => {

  const result = await HotelService.searchHotelsFromSupplier({ ...req.body, ...req.query });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Hotels found matching your search.",
    data: result,

  });
});



const getHotelFullDetails = catchAsync(async (req: Request, res: Response) => {
  const result = await HotelService.getHotelFullDetails(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Hotel details and room availability fetched successfully.",
    data: result,
  });
});



export const HotelControllers = { searchHotels, getHotelRooms, toggleFeatured, removeFeatured, getFeatured, searchHotelsFromSupplier, getHotelFullDetails };