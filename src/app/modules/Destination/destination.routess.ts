import express from 'express';
import { DestinationControllers } from './destination.controller';

const router = express.Router();

// for sync db
router.get('/sync-destinations', DestinationControllers.syncAllDestinations);

// dynamic sync route (cron job )
router.get('/sync-dynamic', DestinationControllers.syncEverythingDynamically);

// search suggetion
router.get('/search', DestinationControllers.searchCities);

// search destination route 
router.get('/destination/search', DestinationControllers.searchDestinations);

export const DestinationRoutes = router;