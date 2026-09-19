import { User } from './profile.model.js';
import { Job, Application } from '../jobs/job.model.js';
import { PointEvent } from '../points/points.model.js';
import { ALL_BADGES, arenasFor, badgesFor, getActivity, getStanding, rankFor, TRACKS } from '../points/points.service.js';
import { learningSummary } from '../learn/learn.routes.js';
import { Project } from '../projects/projects.routes.js';

export const toPublicUser = (user) => ({
    id: String(user._id),
    email: user.email,
    name: user.name,
    picture: user.picture || '',
    headline: user.headline || '',
    intent: user.intent || '',
    skills: user.skills || [],
    onboarded: Boolean(user.onboarded),
    experience: user.experience || '',
    city: user.city || '',
    org: user.org || '',
    links: { github: user.links?.github || '', linkedin: user.links?.linkedin || '', portfolio: user.links?.portfolio || '' },
    prefs: { types: user.prefs?.types || [], modes: user.prefs?.modes || [] },
    points: user.points ?? 0,
    streak: user.streak ?? 0,
    jobsPosted: user.jobsPosted ?? 0,
    applicationsSent: user.applicationsSent ?? 0,
    stats: {
        lessonsDone: user.lessonsDone ?? 0, pathsDone: user.pathsDone ?? 0, projectsSubmitted: user.projectsSubmitted ?? 0,
        upvotesReceived: user.upvotesReceived ?? 0, missionsDone: user.missionsDone ?? 0, reviewsGiven: user.reviewsGiven ?? 0, shortlists: user.shortlists ?? 0,
    },
    arenas: arenasFor(user),
    rank: rankFor(user.points ?? 0),
    badges: badgesFor(user),
});

/** Where the member stands in every board: overall + each arena, all-time and this week. */
const standingsFor = async (userId) => {
    const boards = ['all', ...TRACKS];
    const results = await Promise.all(boards.flatMap((track) => ['all', 'week'].map((period) => getStanding(userId, { track, period }))));
    return Object.fromEntries(boards.map((track, i) => [track, { all: results[i * 2], week: results[i * 2 + 1] }]));
};

export const getDashboard = async (userId) => {
    const user = await User.findById(userId).lean();
    if (!user) return null;

    const [standings, activity, projects, jobs, applications, history] = await Promise.all([
        standingsFor(userId),
        getActivity(userId),
        Project.find({ owner: userId }).sort({ createdAt: -1 }).select('title upvotes liveUrl repoUrl createdAt').lean(),
        Job.find({ postedBy: userId }).sort({ createdAt: -1 }).select('slug title company status applicantsCount views createdAt').lean(),
        Application.find({ applicant: userId }).sort({ createdAt: -1 }).populate('job', 'slug title company status').lean(),
        PointEvent.find({ user: userId }).sort({ createdAt: -1 }).limit(20).lean(),
    ]);

    return {
        user: { ...toPublicUser(user), position: standings.all.all.position },
        standings,
        activity,
        learning: learningSummary(user.learned),
        missions: user.missions || [],
        projects: projects.map((p) => ({ ...p, id: String(p._id) })),
        allBadges: ALL_BADGES,
        jobs: jobs.map((j) => ({ ...j, id: String(j._id) })),
        applications: applications
            .filter((a) => a.job)
            .map((a) => ({ id: String(a._id), status: a.status, createdAt: a.createdAt, job: a.job })),
        history: history.map((h) => ({ type: h.type, points: h.points, ref: h.ref, at: h.createdAt })),
    };
};

export const getPublicMember = async (id) => {
    const user = await User.findById(id).lean();
    if (!user) return null;
    const { email, intent, onboarded, prefs, ...pub } = toPublicUser(user);
    void email; void intent; void onboarded; void prefs;
    const [standings, activity, projects] = await Promise.all([
        standingsFor(user._id),
        getActivity(user._id),
        Project.find({ owner: user._id }).sort({ upvotes: -1 }).select('title description upvotes liveUrl repoUrl stack createdAt').lean(),
    ]);
    return {
        member: { ...pub, joinedAt: user.createdAt },
        standings, activity,
        learning: learningSummary(user.learned).filter((p) => p.done.some(Boolean)),
        projects: projects.map((p) => ({ ...p, id: String(p._id) })),
        allBadges: ALL_BADGES,
    };
};

export const updateProfileById = async (userId, fields) => {
    const user = await User.findByIdAndUpdate(
        userId,
        { $set: fields },
        { returnDocument: 'after', runValidators: true },
    ).lean();
    return user ? toPublicUser(user) : null;
};
