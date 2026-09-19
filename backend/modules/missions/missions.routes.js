import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { User } from '../profile/profile.model.js';
import { awardPoints } from '../points/points.service.js';

// Missions T-001 … T-126 live on the Tasks page (frontend/src/pages/TasksPage.jsx).
const MISSION_COUNT = 126;

const completionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mission: { type: String, required: true },
    prUrl: { type: String, required: true },
}, { timestamps: true });
completionSchema.index({ user: 1, mission: 1 }, { unique: true });
completionSchema.index({ mission: 1, createdAt: 1 });

export const MissionCompletion = mongoose.models.MissionCompletion || mongoose.model('MissionCompletion', completionSchema);

const validMission = (id) => {
    const m = /^T-(\d{3})$/.exec(id);
    return Boolean(m) && Number(m[1]) >= 1 && Number(m[1]) <= MISSION_COUNT;
};

const router = Router();

// How many members finished each mission — shown as competition on the board.
router.get('/stats', async (req, res, next) => {
    try {
        const rows = await MissionCompletion.aggregate([{ $group: { _id: '$mission', count: { $sum: 1 } } }]);
        res.set({ 'CDN-Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600', 'Cache-Control': 'no-cache' });
        res.json({ success: true, completions: Object.fromEntries(rows.map((r) => [r._id, r.count])) });
    }
    catch (error) {
        next(error);
    }
});

// Submit proof (a GitHub PR link) for a mission. +2 points, once per mission.
// ponytail: self-reported with a PR link; add maintainer approval if people start gaming it.
router.post('/:id/complete', requireAuth, async (req, res, next) => {
    try {
        const mission = String(req.params.id);
        const prUrl = String(req.body?.prUrl ?? '').trim().slice(0, 300);
        if (!validMission(mission)) return res.status(400).json({ success: false, message: 'Unknown mission.' });
        if (!/^https:\/\/github\.com\/\S+\/pull\/\d+/i.test(prUrl)) {
            return res.status(400).json({ success: false, message: 'Paste the GitHub pull request link, e.g. https://github.com/org/repo/pull/12.' });
        }
        try {
            await MissionCompletion.create({ user: req.user._id, mission, prUrl });
        }
        catch (error) {
            if (error?.code === 11000) return res.json({ success: true, duplicate: true, reward: { awarded: 0 } });
            throw error;
        }
        await User.updateOne({ _id: req.user._id }, { $addToSet: { missions: mission } });
        const reward = await awardPoints(req.user._id, 'mission_done', mission);
        res.status(201).json({ success: true, reward });
    }
    catch (error) {
        next(error);
    }
});

export default router;
