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


const searchDestinations = catchAsync(async (req: Request, res: Response) => {
  const query = { ...req.query };

  if (query.q) {
    query.search = query.q; 
    delete query.q;       
  }

  const result = await DestinationService.searchDestinationsFromDB(query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Destinations fetched successfully",
    data: result,
  });
});

const searchCities = searchDestinations;

const markPopular = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await DestinationService.updatePopularStatusInDB(id as string, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Destination popularity updated successfully",
    data: result,
  });
});

const getPopular = catchAsync(async (req: Request, res: Response) => {
  const result = await DestinationService.getPopularDestinationsFromDB(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Popular destinations fetched successfully",
    data: result,
  });
});


export const DestinationControllers = { 
  syncAllDestinations, 
  syncEverythingDynamically, 
  searchCities, 
  searchDestinations ,
  markPopular,
  getPopular
};