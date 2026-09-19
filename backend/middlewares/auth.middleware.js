import { clerkClient, getAuth } from '@clerk/express';
import { env } from '../config/env.js';
import { User } from '../modules/profile/profile.model.js';
import { touchDailyActivity } from '../modules/points/points.service.js';

const fail = (res, status, message) => res.status(status).json({ success: false, message });

/** Find our User row for a Clerk session, creating it on first sight. */
const resolveUser = async (clerkId) => {
    let user = await User.findOne({ clerkId }).lean();
    if (user) return user;

    const clerkUser = await clerkClient.users.getUser(clerkId);
    const primary = clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
        ?? clerkUser.emailAddresses[0];
    const email = (primary?.emailAddress ?? '').toLowerCase();
    if (!email) throw new Error('Clerk account has no email address.');

    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ')
        || clerkUser.username
        || email.split('@')[0];

    user = await User.findOneAndUpdate(
        { clerkId },
        { $setOnInsert: { clerkId, email, name, picture: clerkUser.imageUrl ?? '' } },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    ).lean();
    return user;
};

const attachUser = async (req) => {
    if (!req.auth) return null; // clerkMiddleware not mounted (keys missing)
    const { isAuthenticated, userId } = getAuth(req);
    if (!isAuthenticated || !userId) return null;
    const user = await resolveUser(userId);
    req.user = user;
    req.isAdmin = env.adminEmails.includes(user.email.toLowerCase());
    // Daily streak / login point, fire-and-forget so it never blocks the request.
    touchDailyActivity(user).then((result) => {
        if (result?.awarded) req.pointsAwarded = result;
    }).catch(() => {});
    return user;
};

export const requireAuth = async (req, res, next) => {
    try {
        const user = await attachUser(req);
        if (!user) return fail(res, 401, 'Sign in to continue.');
        next();
    }
    catch (error) {
        next(error);
    }
};

export const optionalAuth = async (req, res, next) => {
    try {
        await attachUser(req);
        next();
    }
    catch {
        next();
    }
};
