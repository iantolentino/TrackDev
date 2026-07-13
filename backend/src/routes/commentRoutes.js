import { Router } from 'express';
import { verifyToken, isAdminOrDev } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getComments, addComment } from '../controllers/commentController.js';

const router = Router({ mergeParams: true });

// Staff-only now — no more client persona to comment as.
router.use(verifyToken, isAdminOrDev);

router.get('/', asyncHandler(getComments));
router.post('/', asyncHandler(addComment));

export default router;
