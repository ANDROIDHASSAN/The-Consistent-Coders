import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import mongoose from 'mongoose';
import { getMyProfile, updateMyProfile } from './profile.controller.js';
import { getPublicMember } from './profile.service.js';

const router = Router();

router.get('/me', requireAuth, getMyProfile);
router.patch('/me', requireAuth, updateMyProfile);

// Public member profile: arenas, badges, projects, activity. Never exposes email.
router.get('/members/:id', async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: 'Member not found.' });
        const data = await getPublicMember(req.params.id);
        if (!data) return res.status(404).json({ success: false, message: 'Member not found.' });
        res.set({ 'CDN-Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600', 'Cache-Control': 'no-cache' });
        res.json({ success: true, ...data });
    }
    catch (error) {
        next(error);
    }
});

export default router;
