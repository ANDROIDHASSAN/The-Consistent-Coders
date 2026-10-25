import { Job, Quest, Suggestion, QUEST_STAGES, PROOF_STAGES } from './job.model.js';
import { isExpired, toQuest } from './job.service.js';
import { linkedinPost } from './job.extract.js';
import { awardPoints, POINT_RULES } from '../points/points.service.js';
import { isPlaceholder } from '../../../frontend/src/content/jobCategories.js';

const fail = (res, status, message) => res.status(status).json({ success: false, message });
const DAY_MS = 86400000;
const WEEK_MS = 7 * DAY_MS;
const MAX_INSIDERS = 20;
const MAX_PENDING_SUGGESTIONS = 10;

// Which point rule each stage pays. PROOF_STAGES pay only once an admin verifies the proof (verifyProof).
const STAGE_RULE = { reached: 'reached_out', replied: 'got_reply', interview: 'got_interview', offer: 'got_offer' };

/** Rules owed for reaching `stage`: every stage up to it, so skipping ahead still pays the steps before. */
export const rulesUpTo = (stage) => QUEST_STAGES.slice(0, QUEST_STAGES.indexOf(stage) + 1).map((s) => STAGE_RULE[s]).filter(Boolean);

/** Does moving to `stage` need a proof? Only above what an admin already verified. */
export const needsProof = (stage, verified) => PROOF_STAGES.includes(stage) && QUEST_STAGES.indexOf(stage) > QUEST_STAGES.indexOf(verified || 'reached');

/** A proof link must be plain http(s); anything else (javascript:, data:) is refused. */
export const proofUrl = (raw) => {
    try {
        const url = new URL(String(raw ?? '').trim());
        return /^https?:$/.test(url.protocol) && url.href.length <= 500 ? url.href : '';
    }
    catch {
        return '';
    }
};

const award = async (userId, type, ref) => {
    const result = await awardPoints(userId, type, ref);
    return result.awarded ? { ...result, label: POINT_RULES[type].label } : null;
};

const firstName = (name) => String(name ?? '').trim().split(/\s+/)[0] || 'A member';

/** PUT /jobs/:id/quest { stage, proofUrl?, proofNote? } — move my quest for this job. stage 'none' drops it. */
export const setQuest = async (req, res, next) => {
    try {
        const stage = String(req.body?.stage ?? '');
        if (stage !== 'none' && !QUEST_STAGES.includes(stage)) return fail(res, 400, `Stage must be one of: ${QUEST_STAGES.join(', ')}.`);
        const job = await Job.findById(req.params.id).select('slug status deadline createdAt').lean();
        if (!job) return fail(res, 404, 'Job not found.');
        const key = { user: req.user._id, job: job._id };

        if (stage === 'none') {
            await Quest.deleteOne(key);
            return res.json({ success: true, quest: null, rewards: [] });
        }

        const existing = await Quest.findOne(key).lean();
        // New quests only on live jobs; an interview after the listing closes is still worth logging.
        if (!existing && (job.status !== 'open' || isExpired(job))) return fail(res, 400, 'This job is closed.');

        const now = new Date();
        const update = {
            $set: { stage },
            // $min keeps the first time each stage was reached.
            $min: Object.fromEntries(QUEST_STAGES.slice(0, QUEST_STAGES.indexOf(stage) + 1).map((s) => [`stageAt.${s}`, now])),
        };
        if (needsProof(stage, existing?.verified)) {
            const url = proofUrl(req.body?.proofUrl);
            if (!url) return fail(res, 400, 'Add a proof link (a screenshot on Google Drive, the email, the offer letter) so an admin can verify it.');
            update.$set.proof = { stage, url, note: String(req.body?.proofNote ?? '').trim().slice(0, 300), status: 'pending', at: now };
        }
        else if (existing?.proof && existing.proof.status !== 'verified') {
            update.$unset = { proof: 1 }; // moved below the claim: withdraw it
        }
        const write = () => Quest.findOneAndUpdate(key, update, { upsert: true, returnDocument: 'after' }).lean();
        let quest;
        try {
            quest = await write();
        }
        catch (error) {
            if (error?.code !== 11000) throw error;
            quest = await write(); // lost an upsert race with a double-click; the doc exists now
        }

        // Proof stages pay in verifyProof; here only the free steps (reached out, early bird).
        const rewards = [];
        for (const type of rulesUpTo(PROOF_STAGES.includes(stage) ? 'reached' : stage)) {
            const r = await award(req.user._id, type, job.slug);
            if (r) rewards.push(r);
            if (r && type === 'reached_out') {
                await Job.updateOne({ _id: job._id }, { $inc: { huntersCount: 1 } });
                if (now - new Date(job.createdAt) < DAY_MS) {
                    const early = await award(req.user._id, 'early_bird', job.slug);
                    if (early) rewards.push(early);
                }
            }
        }
        res.json({ success: true, quest: toQuest(quest), rewards });
    }
    catch (error) {
        next(error);
    }
};

/** POST /jobs/:id/insider { note } — toggle "I work here and can refer". */
export const toggleInsider = async (req, res, next) => {
    try {
        const job = await Job.findById(req.params.id).select('slug company insiders.user').lean();
        if (!job) return fail(res, 404, 'Job not found.');
        const me = String(req.user._id);
        if (job.insiders.some((i) => String(i.user) === me)) {
            await Job.updateOne({ _id: job._id }, { $pull: { insiders: { user: req.user._id } } });
            return res.json({ success: true, insider: false, reward: { awarded: 0 } });
        }
        // Cheap anti-farming check: your profile's org has to name the company.
        // ponytail: string match, not proof of employment; add work-email verification if people game it.
        // Whole words only, 3+ chars: an org of "a" or "inc" must not match every company.
        const words = (s) => ` ${String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `;
        const org = words(req.user.org);
        const company = words(job.company);
        const [short, long] = org.length < company.length ? [org, company] : [company, org];
        if (isPlaceholder(job.company) || short.trim().length < 3 || !long.includes(short)) {
            return fail(res, 400, `Set your company to "${job.company}" in your profile first, so members know you really work there.`);
        }
        const note = String(req.body?.note ?? '').trim().slice(0, 200);
        const pushed = await Job.updateOne(
            { _id: job._id, 'insiders.user': { $ne: req.user._id }, [`insiders.${MAX_INSIDERS - 1}`]: { $exists: false } },
            { $push: { insiders: { user: req.user._id, note } } },
        );
        if (!pushed.modifiedCount) return fail(res, 400, 'This job already has enough insiders.');
        const reward = (await award(req.user._id, 'insider_referral', job.slug)) ?? { awarded: 0 };
        res.json({ success: true, insider: true, reward });
    }
    catch (error) {
        next(error);
    }
};

/** GET /jobs/wins — public feed of this week's verified interviews and offers. First names only. */
export const getWins = async (req, res, next) => {
    try {
        const since = new Date(Date.now() - WEEK_MS);
        const won = { $in: ['interview', 'offer'] };
        const [quests, interviews, offers] = await Promise.all([
            Quest.find({ verified: won, updatedAt: { $gte: since } }).sort({ updatedAt: -1 }).limit(20)
                .populate('user', 'name picture').populate('job', 'slug title company').lean(),
            Quest.countDocuments({ verified: won, 'stageAt.interview': { $gte: since } }),
            Quest.countDocuments({ verified: 'offer', updatedAt: { $gte: since } }),
        ]);
        const items = quests.filter((q) => q.user && q.job).map((q) => ({
            id: String(q._id),
            name: firstName(q.user.name),
            picture: q.user.picture || '',
            kind: q.verified,
            job: { slug: q.job.slug, title: q.job.title, company: q.job.company },
            at: q.updatedAt,
        }));
        res.set({ 'CDN-Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600', 'Cache-Control': 'no-cache' });
        res.json({ success: true, items, week: { interviews, offers } });
    }
    catch (error) {
        next(error);
    }
};

/** POST /jobs/suggestions { text } — a member found a job; an admin lists it. */
export const suggestJob = async (req, res, next) => {
    try {
        const text = String(req.body?.text ?? '').trim();
        if (text.length < 20) return fail(res, 400, 'Paste the job post text or its LinkedIn link (at least 20 characters).');
        if (text.length > 20000) return fail(res, 400, 'That is too long. Paste just the job post.');
        const link = text.match(/https?:\/\/\S+/g)?.map(linkedinPost).find(Boolean);
        const sourceUrl = link?.sourceUrl ?? '';
        if (sourceUrl) {
            const listed = await Job.findOne({ sourceUrl }).select('slug').lean();
            if (listed) return res.status(409).json({ success: false, message: 'That job is already on the board.', slug: listed.slug });
            if (await Suggestion.exists({ sourceUrl, status: 'pending' })) return fail(res, 409, 'Someone already suggested that post. It is in the queue.');
        }
        if (await Suggestion.countDocuments({ by: req.user._id, status: 'pending' }) >= MAX_PENDING_SUGGESTIONS) {
            return fail(res, 429, 'You have 10 suggestions waiting. Give the admins a moment to catch up.');
        }
        const suggestion = await Suggestion.create({ by: req.user._id, text, sourceUrl });
        res.status(201).json({ success: true, id: String(suggestion._id) });
    }
    catch (error) {
        next(error);
    }
};

/** GET /jobs/admin/queue — pending suggestions and proofs to verify. */
export const getAdminQueue = async (req, res, next) => {
    try {
        if (!req.isAdmin) return fail(res, 403, 'Admins only.');
        const [suggestions, proofs] = await Promise.all([
            Suggestion.find({ status: 'pending' }).sort({ createdAt: 1 }).limit(50).populate('by', 'name').lean(),
            Quest.find({ 'proof.status': 'pending' }).sort({ updatedAt: 1 }).limit(50).populate('user', 'name').populate('job', 'slug title company').lean(),
        ]);
        res.json({
            success: true,
            suggestions: suggestions.map((s) => ({ id: String(s._id), text: s.text, sourceUrl: s.sourceUrl, by: s.by?.name ?? '', at: s.createdAt })),
            proofs: proofs.filter((q) => q.job).map((q) => ({
                id: String(q._id), member: q.user?.name ?? '', job: q.job, stage: q.proof.stage, url: q.proof.url, note: q.proof.note ?? '', at: q.proof.at,
            })),
        });
    }
    catch (error) {
        next(error);
    }
};

/** GET /jobs/suggestions/:id — admin opens one to prefill the post form. */
export const getSuggestion = async (req, res, next) => {
    try {
        if (!req.isAdmin) return fail(res, 403, 'Admins only.');
        const s = await Suggestion.findById(req.params.id).lean();
        if (!s) return fail(res, 404, 'Suggestion not found.');
        res.json({ success: true, suggestion: { id: String(s._id), text: s.text, sourceUrl: s.sourceUrl, status: s.status } });
    }
    catch (error) {
        next(error);
    }
};

/** PATCH /jobs/suggestions/:id { status: 'rejected' } — approval happens by posting the job (postJob). */
export const rejectSuggestion = async (req, res, next) => {
    try {
        if (!req.isAdmin) return fail(res, 403, 'Admins only.');
        if (req.body?.status !== 'rejected') return fail(res, 400, 'Approve a suggestion by posting it as a job.');
        const s = await Suggestion.findOneAndUpdate({ _id: req.params.id, status: 'pending' }, { $set: { status: 'rejected' } }).lean();
        if (!s) return fail(res, 404, 'No pending suggestion with that id.');
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
};

/** Called by postJob when an admin publishes a suggestion: credits the member who found it. */
export const approveSuggestion = async (suggestionId, slug) => {
    const s = await Suggestion.findOneAndUpdate({ _id: suggestionId, status: 'pending' }, { $set: { status: 'approved', jobSlug: slug } }).lean();
    if (s) await awardPoints(s.by, 'job_suggested', String(s._id));
};

/** POST /jobs/quests/:id/verify { verified } — admin confirms (or rejects) a member's proof. Verifying pays every stage up to it. */
export const verifyProof = async (req, res, next) => {
    try {
        if (!req.isAdmin) return fail(res, 403, 'Admins only.');
        const verified = req.body?.verified === true;
        const quest = await Quest.findOne({ _id: req.params.id, 'proof.status': 'pending' }).populate('job', 'slug').lean();
        if (!quest) return fail(res, 404, 'No pending proof with that id.');
        const set = verified ? { 'proof.status': 'verified', verified: quest.proof.stage } : { 'proof.status': 'rejected' };
        // Matching proof.at too: if the member re-claimed meanwhile, the admin was looking at an old proof.
        const done = await Quest.updateOne({ _id: quest._id, 'proof.status': 'pending', 'proof.at': quest.proof.at }, { $set: set });
        if (!done.modifiedCount) return fail(res, 409, 'That proof just changed. Reload the queue.');
        if (verified && quest.job) {
            for (const type of rulesUpTo(quest.proof.stage)) await awardPoints(quest.user, type, quest.job.slug);
        }
        res.json({ success: true, status: set['proof.status'] });
    }
    catch (error) {
        next(error);
    }
};
