import { Router } from 'express';
import mongoose from 'mongoose';
import { optionalAuth, requireAuth } from '../../middlewares/auth.middleware.js';
import { awardPoints } from '../points/points.service.js';

const projectSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 1500 },
    repoUrl: { type: String, default: '' },
    liveUrl: { type: String, default: '' },
    stack: { type: [String], default: [] },
    voters: { type: [mongoose.Schema.Types.ObjectId], default: [], select: false },
    upvotes: { type: Number, default: 0, index: true },
}, { timestamps: true });
projectSchema.index({ createdAt: -1 });

export const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);

const fail = (res, status, message) => res.status(status).json({ success: false, message });
const isHttps = (v) => /^https:\/\/\S+$/i.test(v);

const toPublic = (p, viewer) => ({
    id: String(p._id),
    title: p.title,
    description: p.description,
    repoUrl: p.repoUrl,
    liveUrl: p.liveUrl,
    stack: p.stack,
    upvotes: p.upvotes,
    createdAt: p.createdAt,
    owner: p.owner?.name ? { id: String(p.owner._id), name: p.owner.name, picture: p.owner.picture || '' } : { id: String(p.owner) },
    isOwner: Boolean(viewer && String(p.owner?._id ?? p.owner) === String(viewer._id)),
});

const router = Router();

// Public gallery. sort=top (most upvoted) | new. owner=<userId> for a member's projects.
router.get('/', optionalAuth, async (req, res, next) => {
    try {
        const filter = {};
        if (req.query.owner && mongoose.isValidObjectId(req.query.owner)) filter.owner = req.query.owner;
        const sort = req.query.sort === 'new' ? { createdAt: -1 } : { upvotes: -1, createdAt: -1 };
        const limit = Math.min(Number(req.query.limit) || 30, 60);
        const items = await Project.find(filter).sort(sort).limit(limit).populate('owner', 'name picture').lean();
        let voted = new Set();
        if (req.user && items.length) {
            const mine = await Project.find({ _id: { $in: items.map((p) => p._id) }, voters: req.user._id }).select('_id').lean();
            voted = new Set(mine.map((p) => String(p._id)));
        }
        res.set({ 'CDN-Cache-Control': req.user ? 'private, no-store' : 'public, s-maxage=30, stale-while-revalidate=300', 'Cache-Control': 'no-cache' });
        res.json({ success: true, projects: items.map((p) => ({ ...toPublic(p, req.user), hasVoted: voted.has(String(p._id)) })) });
    }
    catch (error) {
        next(error);
    }
});

router.post('/', requireAuth, async (req, res, next) => {
    try {
        const b = req.body ?? {};
        const title = String(b.title ?? '').trim().slice(0, 100);
        const description = String(b.description ?? '').trim().slice(0, 1500);
        const repoUrl = String(b.repoUrl ?? '').trim().slice(0, 300);
        const liveUrl = String(b.liveUrl ?? '').trim().slice(0, 300);
        const stack = (Array.isArray(b.stack) ? b.stack : String(b.stack ?? '').split(','))
            .map((s) => String(s).trim().slice(0, 30)).filter(Boolean).slice(0, 8);
        if (title.length < 3) return fail(res, 400, 'Project title must be at least 3 characters.');
        if (description.length < 40) return fail(res, 400, 'Describe the project in at least 40 characters: what it does and the hardest part.');
        if (!repoUrl && !liveUrl) return fail(res, 400, 'Add a GitHub repo or a live link so people can see it.');
        if ((repoUrl && !isHttps(repoUrl)) || (liveUrl && !isHttps(liveUrl))) return fail(res, 400, 'Links must start with https://.');
        const project = await Project.create({ owner: req.user._id, title, description, repoUrl, liveUrl, stack });
        const reward = await awardPoints(req.user._id, 'project_submitted', String(project._id));
        res.status(201).json({ success: true, project: toPublic({ ...project.toObject(), owner: req.user }, req.user), reward });
    }
    catch (error) {
        next(error);
    }
});

// One upvote per member per project; the owner earns +1 per upvote. Upvotes are final.
router.post('/:id/upvote', requireAuth, async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 404, 'Project not found.');
        const project = await Project.findById(req.params.id).select('owner upvotes').lean();
        if (!project) return fail(res, 404, 'Project not found.');
        if (String(project.owner) === String(req.user._id)) return fail(res, 400, "You can't upvote your own project.");
        const updated = await Project.findOneAndUpdate(
            { _id: project._id, voters: { $ne: req.user._id } },
            { $addToSet: { voters: req.user._id }, $inc: { upvotes: 1 } },
            { returnDocument: 'after' },
        ).select('upvotes').lean();
        if (!updated) return res.json({ success: true, duplicate: true, upvotes: project.upvotes });
        await awardPoints(project.owner, 'upvote_received', `${project._id}:${req.user._id}`);
        res.json({ success: true, upvotes: updated.upvotes });
    }
    catch (error) {
        next(error);
    }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 404, 'Project not found.');
        const project = await Project.findById(req.params.id).select('owner').lean();
        if (!project) return fail(res, 404, 'Project not found.');
        if (String(project.owner) !== String(req.user._id) && !req.isAdmin) return fail(res, 403, 'You can only delete your own projects.');
        await Project.deleteOne({ _id: project._id });
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
});

export default router;
