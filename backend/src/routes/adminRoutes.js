import { Router } from 'express';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  getUsers,
  updateUserRole,
  getBlockedEmails,
  addBlockedEmail,
  removeBlockedEmail,
} from '../controllers/adminController.js';

const router = Router();

router.use(verifyToken, isAdmin);

router.get('/users', asyncHandler(getUsers));
router.put('/users/:id', asyncHandler(updateUserRole));
router.get('/blocked-emails', asyncHandler(getBlockedEmails));
router.post('/blocked-emails', asyncHandler(addBlockedEmail));
router.delete('/blocked-emails/:id', asyncHandler(removeBlockedEmail));

export default router;
