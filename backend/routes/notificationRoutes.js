import express from 'express';
import fetchUser from '../middlewares/fetchUser.js';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', fetchUser, getNotifications);
router.put('/mark-all-read', fetchUser, markAllAsRead);
router.put('/:id/read', fetchUser, markAsRead);

export default router;
