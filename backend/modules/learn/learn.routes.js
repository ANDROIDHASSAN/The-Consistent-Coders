import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { User } from '../profile/profile.model.js';
import { awardPoints } from '../points/points.service.js';
import { beginnerTrack, intermediateTrack, advancedTrack } from '../../../frontend/src/data/craftData.js';

// Each learning path's "what you'll learn" items are its checkpoints.
export const PATHS = [...beginnerTrack, ...intermediateTrack, ...advancedTrack]
    .map((p) => ({ id: p.id, title: p.title, tag: p.tag, steps: p.pitfalls.length }));
const byId = new Map(PATHS.map((p) => [p.id, p]));

/** Summarise a user's `learned` keys ("pathId:step") per path. */
export const learningSummary = (learned = []) => {
    const set = new Set(learned);
    return PATHS.map((p) => {
        const done = Array.from({ length: p.steps }, (_, i) => set.has(`${p.id}:${i}`));
        return { id: p.id, title: p.title, tag: p.tag, steps: p.steps, done, completed: done.every(Boolean) };
    });
};

const router = Router();

router.get('/paths', (req, res) => res.json({ success: true, paths: PATHS }));

router.get('/progress', requireAuth, (req, res) => {
    res.json({ success: true, paths: learningSummary(req.user.learned) });
});

// Mark one checkpoint done. +1 per checkpoint, +5 bonus when the whole path is finished.
router.post('/progress', requireAuth, async (req, res, next) => {
    try {
        const pathId = String(req.body?.pathId ?? '');
        const step = Number(req.body?.step);
        const path = byId.get(pathId);
        if (!path || !Number.isInteger(step) || step < 0 || step >= path.steps) {
            return res.status(400).json({ success: false, message: 'Unknown learning checkpoint.' });
        }
        const key = `${pathId}:${step}`;
        const user = await User.findByIdAndUpdate(req.user._id, { $addToSet: { learned: key } }, { returnDocument: 'after' }).lean();
        const rewards = [];
        const lesson = await awardPoints(req.user._id, 'lesson_done', key);
        if (lesson.awarded) rewards.push({ ...lesson, label: `checkpoint in ${path.title}` });
        const summary = learningSummary(user.learned);
        const thisPath = summary.find((p) => p.id === pathId);
        if (thisPath.completed) {
            const bonus = await awardPoints(req.user._id, 'path_done', pathId);
            if (bonus.awarded) rewards.push({ ...bonus, label: `finished ${path.title}` });
        }
        res.json({ success: true, path: thisPath, rewards });
    }
    catch (error) {
        next(error);
    }
});

export default router;
