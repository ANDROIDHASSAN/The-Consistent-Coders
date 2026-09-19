import { Router } from 'express';
import { ALL_BADGES, getLeaderboard, LEVELS, POINT_RULES, RANKS, TRACKS } from './points.service.js';

const router = Router();

// ?track=all|learn|build|hire|apply  &period=all|week
router.get('/leaderboard', async (req, res, next) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 50, 100);
        const track = TRACKS.includes(req.query.track) ? req.query.track : 'all';
        const period = req.query.period === 'week' ? 'week' : 'all';
        const leaders = await getLeaderboard({ track, period, limit });
        // CDN caches for 30s (Vercel reads CDN-Cache-Control); browsers always ask for fresh data.
        res.set({ 'CDN-Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300', 'Cache-Control': 'no-cache' });
        res.json({ success: true, track, period, leaders, rules: POINT_RULES, ranks: RANKS, levels: LEVELS, badges: ALL_BADGES });
    }
    catch (error) {
        next(error);
    }
});

export default router;
