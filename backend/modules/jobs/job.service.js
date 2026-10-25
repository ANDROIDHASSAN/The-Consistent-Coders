import { Job, Application, Quest, JOB_TYPES, WORK_MODES, EXPERIENCE_LEVELS } from './job.model.js';
import { awardPoints } from '../points/points.service.js';
import { EMAIL_RX, linkedinPost, linkedinPostDate } from './job.extract.js';
import { CATEGORY_SLUGS, CITIES, categoryOf, isPlaceholder, skillSlug, slugify } from '../../../frontend/src/content/jobCategories.js';

// "react-developer-intern-acme-labs-pune": role, company and city are what people search for.
const uniqueSlug = async (title, company, location) => {
    const base = slugify([title, company, location].filter((s) => !isPlaceholder(s)).join(' ')) || 'job';
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
        sourceUrl: str('sourceUrl', 500),
        poster: {
            name: String(body.poster?.name ?? '').trim().slice(0, 80),
            profileUrl: String(body.poster?.profileUrl ?? '').trim().slice(0, 300),
        },
        companyLinkedin: str('companyLinkedin', 300).replace(/\/+$/, ''),
        contactEmails: (Array.isArray(body.contactEmails) ? body.contactEmails : String(body.contactEmails ?? '').split(','))
            .map((e) => String(e).trim().toLowerCase()).filter(Boolean).slice(0, 5),
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
    if (data.sourceUrl) {
        const post = linkedinPost(data.sourceUrl);
        if (!post) return { error: 'Source must be a LinkedIn post link (linkedin.com/posts/… or /feed/update/…).' };
        data.sourceUrl = post.sourceUrl;
    }
    if (data.poster.profileUrl && !/^https:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[^/?#\s]+\/?$/i.test(data.poster.profileUrl)) return { error: 'Poster profile must be a linkedin.com/in/… link.' };
    if (data.companyLinkedin && !/^https:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/company\/[^/?#\s]+$/i.test(data.companyLinkedin)) return { error: 'Company LinkedIn must be a linkedin.com/company/… link.' };
    const badEmail = data.contactEmails.find((e) => e.replace(EMAIL_RX, '') !== '');
    if (badEmail) return { error: `"${badEmail}" is not a valid email.` };
    data.category = CATEGORY_SLUGS.includes(body.category) ? body.category : categoryOf(data);

    return { data };
};

// Guests and crawlers get this, so emails never land in Google's index.
export const hideEmails = (text) => String(text ?? '').replace(EMAIL_RX, '[email — sign in to see]');

/** Ways to reach the hiring team. Search links run on the member's own LinkedIn login; we scrape nothing. */
export const reachOutFor = (job) => {
    const people = (role) => (job.companyLinkedin
        ? `${job.companyLinkedin}/people/?keywords=${encodeURIComponent(role)}`
        : `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${role} ${job.company}`)}`);
    return [
        ...(job.poster?.profileUrl ? [{ kind: 'poster', label: job.poster.name || 'Post author', note: 'Wrote the post. Usually the hiring manager.', href: job.poster.profileUrl }] : []),
        ...(job.contactEmails ?? []).map((e) => ({ kind: 'email', label: e, note: 'Shared in the post', href: `mailto:${e}` })),
        { kind: 'search', label: 'Founders', note: `Founders at ${job.company} on LinkedIn`, href: people('founder') },
        { kind: 'search', label: 'Recruiters & HR', note: `Recruiters at ${job.company} on LinkedIn`, href: people('recruiter') },
        { kind: 'search', label: 'Engineering leads', note: `Engineering managers at ${job.company}`, href: people('engineering manager') },
    ];
};

// A deadline counts through the end of its day; listings with no deadline never expire.
const DEADLINE_GRACE_MS = 86400000;
export const DEFAULT_LIFETIME_MS = 21 * 86400000;
export const isExpired = (job, now = Date.now()) => Boolean(job.deadline) && new Date(job.deadline).getTime() + DEADLINE_GRACE_MS < now;
export const openFilter = (now = Date.now()) => ({
    status: 'open',
    $and: [{ $or: [{ deadline: null }, { deadline: { $gte: new Date(now - DEADLINE_GRACE_MS) } }] }],
});

const insidersOf = (job, viewer) => (job.insiders ?? [])
    .filter((i) => i.user?.name) // populated on the detail page only
    .map((i) => ({ id: String(i.user._id), name: i.user.name, picture: i.user.picture || '', headline: i.user.headline || '', note: i.note, isMe: String(i.user._id) === String(viewer._id) }));

/** Members get the reach-out kit and emails; guests get a count, so signing in has a reason. */
const gated = (job, viewer) => {
    const reachOut = reachOutFor(job);
    if (viewer) {
        return {
            description: job.description ?? '', applyUrl: job.applyUrl, reachOut, insiders: insidersOf(job, viewer),
            // Raw fields too, so the edit form round-trips them instead of wiping them.
            poster: job.poster ?? { name: '', profileUrl: '' }, companyLinkedin: job.companyLinkedin ?? '', contactEmails: job.contactEmails ?? [],
        };
    }
    return {
        description: hideEmails(job.description),
        applyUrl: /^mailto:/i.test(job.applyUrl ?? '') ? '' : job.applyUrl,
        reachOut: null,
        reachOutCount: reachOut.length,
    };
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
    category: job.category || categoryOf(job),
    deadline: job.deadline,
    sourceUrl: job.sourceUrl ?? '',
    ...gated(job, viewer),
    status: isExpired(job) ? 'closed' : job.status,
    expired: isExpired(job),
    views: job.views,
    applicantsCount: job.applicantsCount,
    huntersCount: job.huntersCount ?? 0,
    insidersCount: job.insiders?.length ?? 0,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    postedBy: job.postedBy && job.postedBy.name
        ? { id: String(job.postedBy._id), name: job.postedBy.name, picture: job.postedBy.picture || '' }
        : { id: String(job.postedBy) },
    isOwner: Boolean(viewer && String(job.postedBy?._id ?? job.postedBy) === String(viewer._id)),
});

const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const POSTED_DAYS = [1, 3, 7, 14];

/**
 * Company names of open jobs, keyed by URL slug, for /jobs/company/:slug and the sitemap.
 * ponytail: distinct over open jobs per call; store a companySlug field if open jobs pass ~10k.
 */
export const openCompanies = async () => {
    const names = await Job.distinct('company', openFilter());
    // Hand-typed placeholders ("Not avaiable", "N/A", "-") are not companies either.
    return new Map(names.filter((n) => !isPlaceholder(n)).map((n) => [slugify(n), n]));
};
/**
 * Skills of open jobs, keyed by skillSlug: { name (the most used spelling), spellings, jobs }.
 * ponytail: aggregate over open jobs per call, like openCompanies.
 */
export const openSkills = async () => {
    const rows = await Job.aggregate([{ $match: openFilter() }, { $unwind: '$skills' }, { $group: { _id: '$skills', n: { $sum: 1 } } }, { $sort: { n: -1 } }]);
    const skills = new Map();
    for (const { _id, n } of rows) {
        const key = skillSlug(_id);
        if (!key) continue;
        const s = skills.get(key) ?? { name: _id, spellings: [], jobs: 0 };
        s.spellings.push(_id);
        s.jobs += n;
        skills.set(key, s);
    }
    return skills;
};
const SORTS = { new: { createdAt: -1 }, closing: { deadline: 1, createdAt: -1 } };

export const listJobs = async ({ q, skills, skill, type, workMode, experience, category, posted, location, company, paid, sort, status = 'open', page = 1, limit = 24 }) => {
    let filter = {};
    if (status === 'open') filter = openFilter();
    else if (status !== 'all') filter.status = status;
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
    if (POSTED_DAYS.includes(Number(posted))) filter.createdAt = { $gte: new Date(Date.now() - Number(posted) * 86400000) };
    if (location) {
        // A city page slug or any spelling of it ("bangalore" finds "Bengaluru" jobs too).
        const want = String(location).slice(0, 60).toLowerCase();
        const city = CITIES.find((c) => c.slug === want || c.names.some((n) => n.toLowerCase() === want));
        if (city?.slug === 'remote') filter.workMode = 'Remote';
        else filter.location = new RegExp((city?.names ?? [want]).map(escapeRx).join('|'), 'i');
    }
    let companyName = '';
    if (company) {
        companyName = (await openCompanies()).get(slugify(company)) ?? '';
        if (!companyName) return { items: [], total: 0, page: 1, pages: 0, categories: {}, company: '' };
        filter.company = companyName;
    }
    let skillName = '';
    if (skill) {
        const found = (await openSkills()).get(skillSlug(skill));
        if (!found) return { items: [], total: 0, page: 1, pages: 0, categories: {}, skill: '' };
        skillName = found.name;
        filter.skills = { $in: found.spellings };
    }
    if (paid === '1' || paid === 'true') filter.salary = { $gt: '' };
    const safeLimit = Math.min(Math.max(Number(limit) || 24, 1), 100);
    const safePage = Math.max(Number(page) || 1, 1);
    // Chip counts use every filter except the category itself, so switching category never shows a dead chip.
    const byCategory = CATEGORY_SLUGS.includes(category) ? { ...filter, category } : filter;
    const [items, total, counts] = await Promise.all([
        Job.find(byCategory)
            .sort(SORTS[sort] ?? SORTS.new)
            .skip((safePage - 1) * safeLimit)
            .limit(safeLimit)
            .select('-description')
            .lean(),
        Job.countDocuments(byCategory),
        Job.aggregate([{ $match: filter }, { $group: { _id: '$category', n: { $sum: 1 } } }]),
    ]);
    const categories = Object.fromEntries(counts.filter((c) => c._id).map((c) => [c._id, c.n]));
    return { items: items.map((j) => toPublicJob(j)), total, page: safePage, pages: Math.ceil(total / safeLimit), categories, company: companyName, skill: skillName };
};

export const getJobBySlug = async (slug, { countView = false, viewer = null } = {}) => {
    const job = await Job.findOne({ slug }).populate('postedBy', 'name picture').populate('insiders.user', 'name picture headline').lean();
    if (!job) return null;
    // View counter is fire-and-forget: never make the reader wait for it.
    if (countView) Job.updateOne({ _id: job._id }, { $inc: { views: 1 } }).catch(() => {});
    const [hasApplied, quest] = viewer
        ? await Promise.all([Application.exists({ job: job._id, applicant: viewer._id }), Quest.findOne({ user: viewer._id, job: job._id }).lean()])
        : [null, null];
    const result = toPublicJob(job, viewer);
    if (countView) result.views += 1;
    if (viewer) {
        result.hasApplied = Boolean(hasApplied);
        result.quest = quest ? toQuest(quest) : null;
    }
    return result;
};

// Owner-only: the proof link is for the member and the admins.
export const toQuest = (q) => ({
    id: String(q._id), stage: q.stage, stageAt: q.stageAt ?? {}, verified: q.verified || '',
    proof: q.proof?.status ? { stage: q.proof.stage, status: q.proof.status, url: q.proof.url, note: q.proof.note ?? '' } : null,
});

export const createJob = async (user, data) => {
    const slug = await uniqueSlug(data.title, data.company, data.location);
    // Job links go stale fast; an unset deadline auto-expires the listing after 21 days.
    // A LinkedIn import is dated by the post itself, not by when it was copied here.
    const postedAt = linkedinPostDate(data.sourceUrl);
    const job = await Job.create({ ...data, ...(postedAt && { createdAt: postedAt }), deadline: data.deadline ?? new Date(Date.now() + DEFAULT_LIFETIME_MS), slug, postedBy: user._id });
    const reward = await awardPoints(user._id, 'job_posted', slug);
    return { job: toPublicJob({ ...job.toObject(), postedBy: user }, user), reward };
};

export const updateJob = async (job, data, viewer = null) => {
    Object.assign(job, data);
    await job.save();
    return toPublicJob(await job.populate('postedBy', 'name picture'), viewer);
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
