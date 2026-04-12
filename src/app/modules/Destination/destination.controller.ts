// src/app/modules/Destination/destination.controller.ts

import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';

import httpStatus from 'http-status';
import { DestinationService } from './destination.services';


const syncAllDestinations = catchAsync(async (req: Request, res: Response) => {
  const count = await DestinationService.syncAllDestinationsFromSupplier();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `${count} Cities Synced Successfully`,
    data: null,
  });
});


const syncEverythingDynamically = catchAsync(async (req: Request, res: Response) => {
  await DestinationService.syncEverythingDynamically();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Dynamic Sync Process Started",
    data: null,
  });
});


const searchCities = catchAsync(async (req: Request, res: Response) => {
  const result = await DestinationService.searchDestinationsFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Cities fetched successfully",
    data: result,
  });
});

const searchDestinations = catchAsync(async (req: Request, res: Response) => {
  const result = await DestinationService.searchDestinationsFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Destinations fetched successfully",
    data: result,
  });
});

export const DestinationControllers = { 
  syncAllDestinations, 
  syncEverythingDynamically, 
  searchCities, 
  searchDestinations 
};