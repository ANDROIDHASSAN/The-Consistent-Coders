import { getDashboard, updateProfileById } from './profile.service.js';
import { awardPoints } from '../points/points.service.js';

const INTENTS = ['find', 'hire', 'both'];
const EXPERIENCE = ['Student', 'Fresher', 'Junior', 'Mid', 'Senior'];
const JOB_TYPES = ['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance'];
const WORK_MODES = ['Remote', 'Hybrid', 'On-site'];
const cleanUrl = (v) => String(v ?? '').trim().slice(0, 300);
const isHttps = (v) => !v || /^https:\/\/\S+$/i.test(v);
const pickList = (v, allowed) => [...new Set((Array.isArray(v) ? v : []).filter((x) => allowed.includes(x)))];

export const getMyProfile = async (req, res, next) => {
    try {
        const dashboard = await getDashboard(req.user._id);
        if (!dashboard) {
            res.status(404).json({ success: false, message: 'Profile not found.' });
            return;
        }
        res.status(200).json({ success: true, ...dashboard, isAdmin: req.isAdmin });
    }
    catch (error) {
        next(error);
    }
};

/** Partial update: only the fields present in the body change. */
export const updateMyProfile = async (req, res, next) => {
    try {
        const body = req.body ?? {};
        const fields = {};
        if ('name' in body) {
            fields.name = String(body.name ?? '').trim().slice(0, 80);
            if (!fields.name) return res.status(400).json({ success: false, message: 'Name is required.' });
        }
        if ('picture' in body) {
            fields.picture = String(body.picture ?? '').trim().slice(0, 500);
            if (fields.picture && !/^https:\/\/\S+$/i.test(fields.picture)) return res.status(400).json({ success: false, message: 'Photo URL must start with https://.' });
        }
        if ('headline' in body) fields.headline = String(body.headline ?? '').trim().slice(0, 120);
        if ('intent' in body) {
            if (!INTENTS.includes(body.intent)) return res.status(400).json({ success: false, message: 'Intent must be find, hire or both.' });
            fields.intent = body.intent;
        }
        if ('skills' in body) {
            const list = Array.isArray(body.skills) ? body.skills : String(body.skills ?? '').split(',');
            fields.skills = [...new Set(list.map((s) => String(s).trim().slice(0, 30)).filter(Boolean))].slice(0, 12);
        }
        if ('onboarded' in body) fields.onboarded = Boolean(body.onboarded);
        if ('experience' in body) {
            if (body.experience && !EXPERIENCE.includes(body.experience)) return res.status(400).json({ success: false, message: `Experience must be one of: ${EXPERIENCE.join(', ')}.` });
            fields.experience = body.experience || '';
        }
        if ('city' in body) fields.city = String(body.city ?? '').trim().slice(0, 80);
        if ('org' in body) fields.org = String(body.org ?? '').trim().slice(0, 120);
        if ('links' in body) {
            const links = body.links ?? {};
            for (const key of ['github', 'linkedin', 'portfolio']) {
                if (!(key in links)) continue;
                const url = cleanUrl(links[key]);
                if (!isHttps(url)) return res.status(400).json({ success: false, message: `${{ github: 'GitHub', linkedin: 'LinkedIn', portfolio: 'Portfolio' }[key]} link must start with https://.` });
                fields[`links.${key}`] = url;
            }
        }
        if ('prefs' in body) {
            fields['prefs.types'] = pickList(body.prefs?.types, JOB_TYPES);
            fields['prefs.modes'] = pickList(body.prefs?.modes, WORK_MODES);
        }

        const user = await updateProfileById(req.user._id, fields);
        if (!user) return res.status(404).json({ success: false, message: 'Profile not found.' });

        // One-time bonus the first time a headline is set.
        const bonus = fields.headline ? await awardPoints(req.user._id, 'profile_completed', 'headline') : null;
        res.status(200).json({ success: true, user, pointsAwarded: bonus?.awarded ?? 0 });
    }
    catch (error) {
        next(error);
    }
};
