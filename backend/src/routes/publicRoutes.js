import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadAttachments } from '../utils/upload.js';
import {
  createPublicTicket,
  getPublicTicketsByEmail,
  getPublicBoard,
} from '../controllers/publicController.js';

const router = Router();

// No verifyToken — this is the public, unauthenticated submission surface.
router.post('/tickets', uploadAttachments, asyncHandler(createPublicTicket));
router.get('/tickets', asyncHandler(getPublicTicketsByEmail));
router.get('/board', asyncHandler(getPublicBoard));

export default router;
