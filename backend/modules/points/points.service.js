import mongoose from 'mongoose';
import { User } from '../profile/profile.model.js';
import { PointEvent } from './points.model.js';

// The four competitive arenas. `general` actions count toward the overall score only.
export const TRACKS = ['learn', 'build', 'hire', 'apply'];

// Single place that decides what every action is worth and which arena it feeds.
// `counter` names the User field that counts how many times the action happened.
export const POINT_RULES = {
    lesson_done: { points: 1, track: 'learn', counter: 'lessonsDone', label: 'Complete a learning checkpoint' },
    path_done: { points: 5, track: 'learn', counter: 'pathsDone', label: 'Finish a whole learning path' },
    project_submitted: { points: 3, track: 'build', counter: 'projectsSubmitted', label: 'Submit a project' },
    upvote_received: { points: 1, track: 'build', counter: 'upvotesReceived', label: 'Your project gets an upvote' },
    mission_done: { points: 2, track: 'build', counter: 'missionsDone', label: 'Complete a mission (with PR link)' },
    job_posted: { points: 1, track: 'hire', counter: 'jobsPosted', label: 'Post a job' },
    first_applicant: { points: 1, track: 'hire', counter: null, label: 'Your job gets its first applicant' },
    applicant_reviewed: { points: 1, track: 'hire', counter: 'reviewsGiven', label: 'Review an applicant' },
    job_applied: { points: 1, track: 'apply', counter: 'applicationsSent', label: 'Apply to a job' },
    shortlisted: { points: 2, track: 'apply', counter: 'shortlists', label: 'Get shortlisted' },
    profile_completed: { points: 1, track: 'general', counter: null, label: 'Add a profile headline (once)' },
    daily_login: { points: 1, track: 'general', counter: null, label: 'Daily check-in' },
};

// Overall rank by total points.
export const RANKS = [
    { name: 'Rookie', min: 0 },
    { name: 'Contributor', min: 5 },
    { name: 'Builder', min: 15 },
    { name: 'Architect', min: 40 },
    { name: 'Legend', min: 100 },
];

// Per-arena levels 1–10: points needed to reach each level.
export const LEVELS = [0, 3, 8, 15, 25, 40, 60, 85, 115, 150];

export const rankFor = (points) => {
    let current = RANKS[0];
    let next = null;
    for (let i = 0; i < RANKS.length; i += 1) {
        if (points >= RANKS[i].min) {
            current = RANKS[i];
            next = RANKS[i + 1] ?? null;
        }
    }
    return { name: current.name, next: next ? { name: next.name, min: next.min } : null };
};

export const levelFor = (points) => {
    let level = 1;
    for (let i = 0; i < LEVELS.length; i += 1) if (points >= LEVELS[i]) level = i + 1;
    const floor = LEVELS[level - 1];
    const ceil = LEVELS[level] ?? null;
    return { level, floor, next: ceil, progress: ceil === null ? 100 : Math.round(((points - floor) / (ceil - floor)) * 100) };
};

const BADGES = [
    ['first_post', 'First Post', '📣', (u) => u.jobsPosted >= 1],
    ['recruiter', 'Recruiter', '🧲', (u) => u.jobsPosted >= 5],
    ['talent_scout', 'Talent Scout', '🔎', (u) => u.reviewsGiven >= 5],
    ['first_apply', 'First Application', '🚀', (u) => u.applicationsSent >= 1],
    ['hustler', 'Hustler', '🔥', (u) => u.applicationsSent >= 10],
    ['shortlisted', 'Shortlisted', '⭐', (u) => u.shortlists >= 1],
    ['first_lesson', 'First Lesson', '📖', (u) => u.lessonsDone >= 1],
    ['path_complete', 'Path Complete', '🎓', (u) => u.pathsDone >= 1],
    ['scholar', 'Scholar', '🧠', (u) => u.pathsDone >= 3],
    ['shipper', 'Shipper', '🛠️', (u) => u.projectsSubmitted >= 1],
    ['crowd_favourite', 'Crowd Favourite', '💚', (u) => u.upvotesReceived >= 5],
    ['mission_runner', 'Mission Runner', '🎯', (u) => u.missionsDone >= 3],
    ['streak_3', '3-Day Streak', '⚡', (u) => u.streak >= 3],
    ['streak_7', 'Week Streak', '🏆', (u) => u.streak >= 7],
    ['architect', 'Architect', '🏛️', (u) => u.points >= 40],
];

const withDefaults = (u) => ({
    points: 0, streak: 0, jobsPosted: 0, applicationsSent: 0, reviewsGiven: 0, shortlists: 0,
    lessonsDone: 0, pathsDone: 0, projectsSubmitted: 0, upvotesReceived: 0, missionsDone: 0, ...u,
});

export const badgesFor = (user) => {
    const u = withDefaults(user);
    return BADGES.filter(([, , , test]) => test(u)).map(([id, label, icon]) => ({ id, label, icon }));
};

export const ALL_BADGES = BADGES.map(([id, label, icon]) => ({ id, label, icon }));

const trackPointsOf = (user) => Object.fromEntries(TRACKS.map((t) => [t, user.trackPoints?.[t] ?? 0]));

/** Per-arena summary for a user: points and level in each arena. */
export const arenasFor = (user) => Object.fromEntries(TRACKS.map((t) => {
    const pts = user.trackPoints?.[t] ?? 0;
    return [t, { points: pts, ...levelFor(pts) }];
}));

/**
 * Award points for an action. `ref` makes an action idempotent per target: the unique
 * index on (user, type, ref) lets exactly one award through, even under double-clicks.
 */
export const awardPoints = async (userId, type, ref = '') => {
    const rule = POINT_RULES[type];
    if (!rule) throw new Error(`Unknown point rule: ${type}`);
    try {
        await PointEvent.create({ user: userId, type, points: rule.points, ref, track: rule.track });
    }
    catch (error) {
        if (error?.code === 11000) return { awarded: 0 };
        throw error;
    }
    const inc = { points: rule.points };
    if (TRACKS.includes(rule.track)) inc[`trackPoints.${rule.track}`] = rule.points;
    if (rule.counter) inc[rule.counter] = 1;
    const user = await User.findByIdAndUpdate(userId, { $inc: inc }, { returnDocument: 'after' }).lean();
    return { awarded: rule.points, track: rule.track, total: user.points, rank: rankFor(user.points) };
};

const dayKey = (date) => date.toISOString().slice(0, 10);

/** Called on every authenticated request: keeps streak + awards one login point per day. */
export const touchDailyActivity = async (user) => {
    const today = dayKey(new Date());
    const last = user.lastActiveAt ? dayKey(new Date(user.lastActiveAt)) : '';
    if (last === today) return null;
    const yesterday = dayKey(new Date(Date.now() - 86400000));
    const streak = last === yesterday ? (user.streak || 0) + 1 : 1;
    await User.updateOne({ _id: user._id }, { $set: { lastActiveAt: new Date(), streak } });
    return awardPoints(user._id, 'daily_login', today);
};

const WEEK_MS = 7 * 86400000;
const PUBLIC_FIELDS = 'name picture headline points trackPoints jobsPosted applicationsSent streak lessonsDone pathsDone projectsSubmitted upvotesReceived missionsDone reviewsGiven shortlists';

const toRow = (u, i, score) => ({
    rank: i + 1,
    id: String(u._id),
    name: u.name,
    picture: u.picture,
    headline: u.headline,
    score,
    points: u.points,
    trackPoints: trackPointsOf(u),
    streak: u.streak,
    title: rankFor(u.points).name,
    badges: badgesFor(u),
});

/**
 * Leaderboard for one arena (or overall) over all time or the last 7 days.
 * Weekly boards are summed from the point ledger, so they reset naturally.
 */
export const getLeaderboard = async ({ track = 'all', period = 'all', limit = 50 } = {}) => {
    const safeTrack = TRACKS.includes(track) ? track : 'all';
    if (period === 'week') {
        const match = { createdAt: { $gte: new Date(Date.now() - WEEK_MS) } };
        if (safeTrack !== 'all') match.track = safeTrack;
        const sums = await PointEvent.aggregate([
            { $match: match },
            { $group: { _id: '$user', score: { $sum: '$points' }, last: { $max: '$createdAt' } } },
            { $sort: { score: -1, last: 1 } },
            { $limit: limit },
        ]);
        const users = await User.find({ _id: { $in: sums.map((s) => s._id) } }).select(PUBLIC_FIELDS).lean();
        const byId = new Map(users.map((u) => [String(u._id), u]));
        return sums.filter((s) => byId.has(String(s._id))).map((s, i) => toRow(byId.get(String(s._id)), i, s.score));
    }
    const field = safeTrack === 'all' ? 'points' : `trackPoints.${safeTrack}`;
    const users = await User.find({ [field]: { $gt: 0 } }).sort({ [field]: -1, updatedAt: 1 }).limit(limit).select(PUBLIC_FIELDS).lean();
    return users.map((u, i) => toRow(u, i, safeTrack === 'all' ? u.points : u.trackPoints?.[safeTrack] ?? 0));
};

/** Rank + score in one board, and the person directly ahead (the rival to overtake). */
export const getStanding = async (userId, { track = 'all', period = 'all' } = {}) => {
    const id = new mongoose.Types.ObjectId(String(userId));
    if (period === 'week') {
        const match = { createdAt: { $gte: new Date(Date.now() - WEEK_MS) } };
        if (track !== 'all') match.track = track;
        // ponytail: scans the week's ledger per call; add a weekly rollup collection past ~100k events/week.
        const sums = await PointEvent.aggregate([
            { $match: match },
            { $group: { _id: '$user', score: { $sum: '$points' } } },
        ]);
        const mine = sums.find((s) => String(s._id) === String(id));
        const score = mine?.score ?? 0;
        const ahead = sums.filter((s) => s.score > score);
        const closest = ahead.sort((a, b) => a.score - b.score)[0];
        const rivalUser = closest ? await User.findById(closest._id).select('name').lean() : null;
        return {
            score,
            position: score > 0 ? ahead.length + 1 : null,
            rival: rivalUser ? { id: String(rivalUser._id), name: rivalUser.name, gap: closest.score - score } : null,
        };
    }
    const field = track === 'all' ? 'points' : `trackPoints.${track}`;
    const me = await User.findById(id).select(`points trackPoints`).lean();
    const score = track === 'all' ? me?.points ?? 0 : me?.trackPoints?.[track] ?? 0;
    const [aheadCount, rival] = await Promise.all([
        User.countDocuments({ [field]: { $gt: score } }),
        User.findOne({ [field]: { $gt: score } }).sort({ [field]: 1 }).select('name points trackPoints').lean(),
    ]);
    const rivalScore = rival ? (track === 'all' ? rival.points : rival.trackPoints?.[track] ?? 0) : 0;
    return {
        score,
        position: score > 0 ? aheadCount + 1 : null,
        rival: rival ? { id: String(rival._id), name: rival.name, gap: rivalScore - score } : null,
    };
};

export const getUserRank = async (userId) => (await getStanding(userId)).position;

/** Points per day for the last `days` days, for the activity heatmap. */
export const getActivity = async (userId, days = 84) => {
    const since = new Date(Date.now() - days * 86400000);
    const rows = await PointEvent.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(String(userId)), createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, points: { $sum: '$points' } } },
    ]);
    return Object.fromEntries(rows.map((r) => [r._id, r.points]));
};
