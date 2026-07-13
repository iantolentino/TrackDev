import { Router } from 'express';
import { verifyToken, isAdmin, isAdminOrDev } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadAttachments } from '../utils/upload.js';
import {
  getAssignableUsers,
  getTickets,
  getTicketById,
  getTicketActivity,
  createTicket,
  updateTicket,
  changeStatus,
  acceptTicket,
  rejectTicket,
  setVisibility,
  deleteTicket,
} from '../controllers/ticketController.js';

const router = Router();

// Whole board is staff-only now — public submissions go through /api/public instead.
router.use(verifyToken, isAdminOrDev);

router.get('/', asyncHandler(getTickets));
router.get('/assignable-users', asyncHandler(getAssignableUsers));
router.get('/:id', asyncHandler(getTicketById));
router.get('/:id/activity', asyncHandler(getTicketActivity));
router.post('/', uploadAttachments, asyncHandler(createTicket));
router.put('/:id', asyncHandler(updateTicket));
router.patch('/:id/status', asyncHandler(changeStatus));
router.patch('/:id/accept', asyncHandler(acceptTicket));
router.patch('/:id/reject', asyncHandler(rejectTicket));
router.patch('/:id/visibility', asyncHandler(setVisibility));
router.delete('/:id', isAdmin, asyncHandler(deleteTicket));

export default router;
