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

  // যদি ইউজার 'q' পাঠিয়ে থাকে (যেমন: ?q=ba)
  if (query.q) {
    query.search = query.q; // কুয়েরি বিল্ডারের জন্য 'search' এ ভ্যালু সেট করলাম
    delete query.q;        // অরিজিনাল 'q' ডিলিট করলাম যাতে filter() এ সমস্যা না হয়
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



export const DestinationControllers = { 
  syncAllDestinations, 
  syncEverythingDynamically, 
  searchCities, 
  searchDestinations 
};