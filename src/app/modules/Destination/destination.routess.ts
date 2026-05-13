import express from 'express';
import { DestinationControllers } from './destination.controller';
import { USER_ROLE } from '../Auth/auth.constant';
import auth from '../../middleware/auth';
import { upload } from '../../middleware/multer';
import uploadImage from '../../middleware/upload';

const router = express.Router();

// for sync db
router.get('/sync-destinations', DestinationControllers.syncAllDestinations);

// dynamic sync route (cron job )
router.get('/sync-dynamic', DestinationControllers.syncEverythingDynamically);

// search suggetion
router.get('/search', DestinationControllers.searchCities);

// search destination route 
router.get('/destination/search', DestinationControllers.searchDestinations);
router.patch(
  '/mark-popular/:id',
  auth(USER_ROLE.admin, USER_ROLE.superAdmin),
  upload.single('image'),
  async (req, res, next) => {
    if (req.file) {
      const imageUrl = await uploadImage(req);
      req.body.image = imageUrl;
    }
    next();
  },
  DestinationControllers.markPopular
);
router.get('/popular', DestinationControllers.getPopular);
export const DestinationRoutes = router;