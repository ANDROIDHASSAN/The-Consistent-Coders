import { Job, Application, JOB_TYPES, WORK_MODES, EXPERIENCE_LEVELS } from './job.model.js';
import {
    applyToJob, createJob, getJobBySlug, listApplicants, listJobs, parseJobInput, updateJob,
} from './job.service.js';
import { awardPoints } from '../points/points.service.js';
import { extractJobFromText, extractJobFromUrl } from './job.extract.js';

const fail = (res, status, message) => res.status(status).json({ success: false, message });

export const getJobOptions = (req, res) => {
    res.json({ success: true, types: JOB_TYPES, workModes: WORK_MODES, experience: EXPERIENCE_LEVELS });
};

// Paste-to-fill: { text } or { url } → a draft for the post-job form.
export const extractJob = async (req, res, next) => {
    try {
        const text = String(req.body?.text ?? '').trim().slice(0, 20000);
        const url = String(req.body?.url ?? '').trim() || (/^https?:\/\/\S+$/i.test(text) ? text : '');
        if (!url && text.length < 20) return fail(res, 400, 'Paste the job post text or a link first.');
        const draft = url ? await extractJobFromUrl(url) : extractJobFromText(text);
        res.json({ success: true, draft });
    }
    catch (error) {
        if (error.name === 'TimeoutError') return fail(res, 504, 'That page took too long to load. Paste the job text instead.');
        if (error instanceof TypeError || /^(Only public|That does not|Could not read)/.test(error.message)) return fail(res, 400, error.message.startsWith('fetch failed') ? 'Could not reach that link. Paste the job text instead.' : error.message);
        next(error);
    }
};

export const getJobs = async (req, res, next) => {
    try {
        const result = await listJobs(req.query);
        // CDN caches for 30s (Vercel reads CDN-Cache-Control); browsers always ask for fresh data.
        res.set({ 'CDN-Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300', 'Cache-Control': 'no-cache' });
        res.json({ success: true, ...result });
    }
    catch (error) {
        next(error);
    }
};

export const getJob = async (req, res, next) => {
    try {
        const job = await getJobBySlug(req.params.slug, { countView: true, viewer: req.user ?? null });
        if (!job) return fail(res, 404, 'Job not found.');
        res.json({ success: true, job });
    }
    catch (error) {
        next(error);
    }
};

export const postJob = async (req, res, next) => {
    try {
        const { data, error } = parseJobInput(req.body);
        if (error) return fail(res, 400, error);
        const { job, reward } = await createJob(req.user, data);
        res.status(201).json({ success: true, job, reward });
    }
    catch (error) {
        next(error);
    }
};

/** Loads the job and checks the caller owns it (or is admin). */
const loadOwnedJob = async (req, res) => {
    const job = await Job.findById(req.params.id);
    if (!job) {
        fail(res, 404, 'Job not found.');
        return null;
    }
    if (String(job.postedBy) !== String(req.user._id) && !req.isAdmin) {
        fail(res, 403, 'You can only manage jobs you posted.');
        return null;
    }
    return job;
};

export const patchJob = async (req, res, next) => {
    try {
        const job = await loadOwnedJob(req, res);
        if (!job) return;

        // Status-only updates (close/reopen) skip full validation.
        if (Object.keys(req.body ?? {}).length === 1 && req.body.status) {
            if (!['open', 'closed'].includes(req.body.status)) return fail(res, 400, 'Status must be open or closed.');
            job.status = req.body.status;
            await job.save();
            return res.json({ success: true, job: await getJobBySlug(job.slug, { viewer: req.user }) });
        }

        const { data, error } = parseJobInput(req.body);
        if (error) return fail(res, 400, error);
        const updated = await updateJob(job, data);
        res.json({ success: true, job: updated });
    }
    catch (error) {
        next(error);
    }
};

export const deleteJob = async (req, res, next) => {
    try {
        const job = await loadOwnedJob(req, res);
        if (!job) return;
        await Promise.all([Application.deleteMany({ job: job._id }), job.deleteOne()]);
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
};

export const apply = async (req, res, next) => {
    try {
        const job = await Job.findById(req.params.id).lean();
        if (!job) return fail(res, 404, 'Job not found.');
        if (job.status !== 'open') return fail(res, 400, 'This job is closed.');
        if (String(job.postedBy) === String(req.user._id)) return fail(res, 400, 'You cannot apply to your own job.');

        const note = String(req.body?.note ?? '').trim().slice(0, 2000);
        const portfolioUrl = String(req.body?.portfolioUrl ?? '').trim().slice(0, 300);
        if (portfolioUrl && !/^https?:\/\/\S+$/i.test(portfolioUrl)) return fail(res, 400, 'Portfolio link must start with http(s)://.');

        const { reward, duplicate } = await applyToJob(job, req.user, { note, portfolioUrl });
        res.status(duplicate ? 200 : 201).json({ success: true, duplicate, reward });
    }
    catch (error) {
        next(error);
    }
};

export const getApplicants = async (req, res, next) => {
    try {
        const job = await loadOwnedJob(req, res);
        if (!job) return;
        const applicants = await listApplicants(job._id);
        res.json({ success: true, applicants });
    }
    catch (error) {
        next(error);
    }
};

export const setApplicationStatus = async (req, res, next) => {
    try {
        const job = await loadOwnedJob(req, res);
        if (!job) return;
        const status = String(req.body?.status ?? '');
        if (!['sent', 'viewed', 'shortlisted', 'rejected'].includes(status)) return fail(res, 400, 'Invalid status.');
        const app = await Application.findOneAndUpdate(
            { _id: req.params.applicationId, job: job._id },
            { $set: { status } },
            { returnDocument: 'after' },
        ).lean();
        if (!app) return fail(res, 404, 'Application not found.');
        // Reward posters for giving feedback, and candidates for making the shortlist.
        const review = status !== 'sent' ? await awardPoints(req.user._id, 'applicant_reviewed', String(app._id)) : { awarded: 0 };
        if (status === 'shortlisted') await awardPoints(app.applicant, 'shortlisted', String(app._id));
        res.json({ success: true, status: app.status, reward: review });
    }
    catch (error) {
        next(error);
    }
};
