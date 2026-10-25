// Job card signals computed in the browser: freshness and how well a job fits the viewer.
const HOUR = 3600000;
const DAY = 24 * HOUR;

/** 🔥 first 24h (early-bird window), ✨ first 3 days, ❄️ closing within 3 days. */
export const heatOf = (job, now = Date.now()) => {
    const age = now - new Date(job.createdAt).getTime();
    if (age < DAY) return { icon: '🔥', label: 'Hot', earlyBirdHours: Math.max(1, Math.ceil((DAY - age) / HOUR)) };
    if (age < 3 * DAY) return { icon: '✨', label: 'Fresh' };
    if (job.deadline && new Date(job.deadline).getTime() + DAY - now < 3 * DAY) return { icon: '❄️', label: 'Closing soon' };
    return null;
};

/** How many of the job's skills the viewer listed; null when either side has none. */
export const skillMatch = (jobSkills = [], mySkills = []) => {
    if (!jobSkills.length || !mySkills.length) return null;
    const mine = new Set(mySkills.map((s) => s.toLowerCase()));
    return { hit: jobSkills.filter((s) => mine.has(s.toLowerCase())).length, total: jobSkills.length };
};

export const QUEST_STEPS = [
    { id: 'saved', icon: '📌', label: 'Saved', pts: 0 },
    { id: 'reached', icon: '👋', label: 'Reached out', pts: 1 },
    { id: 'replied', icon: '💬', label: 'Got a reply', pts: 3, proof: true },
    { id: 'interview', icon: '🎤', label: 'Interview', pts: 10, proof: true },
    { id: 'offer', icon: '🏅', label: 'Offer', pts: 50, proof: true },
];
