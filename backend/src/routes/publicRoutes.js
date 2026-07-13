import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadAttachments } from '../utils/upload.js';
import { createPublicTicket, getPublicTicketsByEmail } from '../controllers/publicController.js';

const router = Router();

// No verifyToken — this is the public, unauthenticated submission surface.
router.post('/tickets', uploadAttachments, asyncHandler(createPublicTicket));
router.get('/tickets', asyncHandler(getPublicTicketsByEmail));

export default router;
