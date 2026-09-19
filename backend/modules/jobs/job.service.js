import { Job, Application, JOB_TYPES, WORK_MODES, EXPERIENCE_LEVELS } from './job.model.js';
import { awardPoints } from '../points/points.service.js';

const slugify = (text) => text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const uniqueSlug = async (title, company) => {
    const base = slugify(`${title} ${company}`) || 'job';
    let slug = base;
    let n = 2;
    // ponytail: linear probe; fine until a title/company pair repeats hundreds of times.
    while (await Job.exists({ slug })) {
        slug = `${base}-${n}`;
        n += 1;
    }
    return slug;
};

const isHttpUrl = (value) => /^https?:\/\/\S+$/i.test(value);

/** Validate + normalise a job payload. Returns { data } or { error }. */
export const parseJobInput = (body = {}) => {
    const str = (key, max = 200) => String(body[key] ?? '').trim().slice(0, max);
    const data = {
        title: str('title', 120),
        company: str('company', 120),
        companyUrl: str('companyUrl', 300),
        type: str('type'),
        workMode: str('workMode'),
        experience: str('experience'),
        location: str('location', 120),
        salary: str('salary', 80),
        description: String(body.description ?? '').trim().slice(0, 8000),
        applyUrl: str('applyUrl', 500),
        skills: Array.isArray(body.skills)
            ? body.skills.map((s) => String(s).trim()).filter(Boolean).slice(0, 12)
            : String(body.skills ?? '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 12),
        deadline: body.deadline ? new Date(body.deadline) : null,
    };

    if (data.title.length < 3) return { error: 'Title must be at least 3 characters.' };
    if (data.company.length < 2) return { error: 'Company name is required.' };
    if (!JOB_TYPES.includes(data.type)) return { error: `Job type must be one of: ${JOB_TYPES.join(', ')}.` };
    if (!WORK_MODES.includes(data.workMode)) return { error: `Work mode must be one of: ${WORK_MODES.join(', ')}.` };
    if (!EXPERIENCE_LEVELS.includes(data.experience)) return { error: `Experience must be one of: ${EXPERIENCE_LEVELS.join(', ')}.` };
    if (!data.location) return { error: 'Location is required (use "Remote" if remote).' };
    if (data.description.length < 80) return { error: 'Description must be at least 80 characters so candidates (and Google) understand the role.' };
    if (data.applyUrl && !isHttpUrl(data.applyUrl) && !/^mailto:/i.test(data.applyUrl)) return { error: 'Apply link must start with http(s):// or mailto:.' };
    if (data.companyUrl && !isHttpUrl(data.companyUrl)) return { error: 'Company website must start with http(s)://.' };
    if (data.deadline && Number.isNaN(data.deadline.getTime())) return { error: 'Deadline is not a valid date.' };

    return { data };
};

export const toPublicJob = (job, viewer = null) => ({
    id: String(job._id),
    slug: job.slug,
    title: job.title,
    company: job.company,
    companyUrl: job.companyUrl,
    type: job.type,
    workMode: job.workMode,
    experience: job.experience,
    location: job.location,
    salary: job.salary,
    skills: job.skills,
    description: job.description ?? '',
    applyUrl: job.applyUrl,
    deadline: job.deadline,
    status: job.status,
    views: job.views,
    applicantsCount: job.applicantsCount,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    postedBy: job.postedBy && job.postedBy.name
        ? { id: String(job.postedBy._id), name: job.postedBy.name, picture: job.postedBy.picture || '' }
        : { id: String(job.postedBy) },
    isOwner: Boolean(viewer && String(job.postedBy?._id ?? job.postedBy) === String(viewer._id)),
});

const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const listJobs = async ({ q, skills, type, workMode, experience, status = 'open', page = 1, limit = 24 }) => {
    const filter = {};
    if (status !== 'all') filter.status = status;
    const list = (v) => String(v).split(',').map((s) => s.trim()).filter(Boolean);
    if (type) filter.type = { $in: list(type) };
    if (workMode) filter.workMode = { $in: list(workMode) };
    if (experience) filter.experience = experience;
    if (skills) {
        const wanted = String(skills).split(',').map((s) => s.trim()).filter(Boolean).slice(0, 12);
        if (wanted.length) filter.skills = { $in: wanted.map((s) => new RegExp(`^${escapeRx(s)}$`, 'i')) };
    }
    if (q) {
        const rx = new RegExp(escapeRx(String(q)), 'i');
        filter.$or = [{ title: rx }, { company: rx }, { skills: rx }, { location: rx }];
    }
    const safeLimit = Math.min(Math.max(Number(limit) || 24, 1), 100);
    const safePage = Math.max(Number(page) || 1, 1);
    const [items, total] = await Promise.all([
        Job.find(filter)
            .sort({ createdAt: -1 })
            .skip((safePage - 1) * safeLimit)
            .limit(safeLimit)
            .select('-description')
            .lean(),
        Job.countDocuments(filter),
    ]);
    return { items: items.map((j) => toPublicJob(j)), total, page: safePage, pages: Math.ceil(total / safeLimit) };
};

export const getJobBySlug = async (slug, { countView = false, viewer = null } = {}) => {
    const job = await Job.findOne({ slug }).populate('postedBy', 'name picture').lean();
    if (!job) return null;
    // View counter is fire-and-forget: never make the reader wait for it.
    if (countView) Job.updateOne({ _id: job._id }, { $inc: { views: 1 } }).catch(() => {});
    const hasApplied = viewer ? await Application.exists({ job: job._id, applicant: viewer._id }) : null;
    const result = toPublicJob(job, viewer);
    if (countView) result.views += 1;
    if (viewer) result.hasApplied = Boolean(hasApplied);
    return result;
};

export const createJob = async (user, data) => {
    const slug = await uniqueSlug(data.title, data.company);
    const job = await Job.create({ ...data, slug, postedBy: user._id });
    const reward = await awardPoints(user._id, 'job_posted', slug);
    return { job: toPublicJob({ ...job.toObject(), postedBy: user }, user), reward };
};

export const updateJob = async (job, data) => {
    Object.assign(job, data);
    await job.save();
    return toPublicJob(await job.populate('postedBy', 'name picture'));
};

export const applyToJob = async (job, user, { note, portfolioUrl }) => {
    const existing = await Application.findOne({ job: job._id, applicant: user._id }).lean();
    if (existing) return { application: existing, reward: { awarded: 0 }, duplicate: true };

    let application;
    try {
        application = await Application.create({ job: job._id, applicant: user._id, note, portfolioUrl });
    }
    catch (error) {
        // Two simultaneous submits: the unique index lets exactly one through.
        if (error?.code === 11000) return { application: null, reward: { awarded: 0 }, duplicate: true };
        throw error;
    }
    const counted = await Job.findByIdAndUpdate(job._id, { $inc: { applicantsCount: 1 } }, { returnDocument: 'after' }).select('applicantsCount').lean();
    const reward = await awardPoints(user._id, 'job_applied', job.slug);
    // The poster earns a hiring point when their listing attracts its first applicant.
    if (counted?.applicantsCount === 1) await awardPoints(job.postedBy, 'first_applicant', job.slug);
    return { application, reward, duplicate: false };
};

export const listApplicants = async (jobId) => {
    const apps = await Application.find({ job: jobId })
        .sort({ createdAt: -1 })
        .populate('applicant', 'name email picture headline points experience city org links')
        .lean();
    return apps.map((a) => ({
        id: String(a._id),
        note: a.note,
        portfolioUrl: a.portfolioUrl,
        status: a.status,
        createdAt: a.createdAt,
        applicant: a.applicant ? {
            id: String(a.applicant._id),
            name: a.applicant.name,
            email: a.applicant.email,
            picture: a.applicant.picture,
            headline: a.applicant.headline,
            points: a.applicant.points,
            experience: a.applicant.experience || '',
            city: a.applicant.city || '',
            org: a.applicant.org || '',
            links: a.applicant.links || {},
        } : null,
    }));
};
