import express from 'express';
import { DestinationControllers } from './destination.controller';

const router = express.Router();

// সাপ্লায়ার থেকে ডাটা এনে ডিবিতে সেভ করার রুট
router.get('/sync-destinations', DestinationControllers.syncAllDestinations);

// ভবিষ্যতে ড্রপডাউনের জন্য সার্চ রুট এখানে যোগ করতে পারেন
// router.get('/search', DestinationControllers.searchDestinations);
router.get('/search', DestinationControllers.searchCities);
router.get('/destination/search', DestinationControllers.searchDestinations);
export const DestinationRoutes = router;