import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    clerkId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    picture: { type: String, default: '' },
    headline: { type: String, default: '', trim: true, maxlength: 120 },
    // Onboarding: what the member came for, what they know, and whether they finished the welcome flow.
    intent: { type: String, enum: ['find', 'hire', 'both', ''], default: '' },
    skills: { type: [String], default: [] },
    onboarded: { type: Boolean, default: false },
    experience: { type: String, enum: ['Student', 'Fresher', 'Junior', 'Mid', 'Senior', ''], default: '' },
    city: { type: String, default: '', trim: true, maxlength: 80 },
    org: { type: String, default: '', trim: true, maxlength: 120 }, // college or company
    links: {
        github: { type: String, default: '' },
        linkedin: { type: String, default: '' },
        portfolio: { type: String, default: '' },
    },
    // What a candidate is looking for; drives recommendations.
    prefs: {
        types: { type: [String], default: [] },
        modes: { type: [String], default: [] },
    },
    // Gamification — points are the only source of truth; rank/badges derive from them.
    points: { type: Number, default: 0, index: true },
    jobsPosted: { type: Number, default: 0 },
    applicationsSent: { type: Number, default: 0 },
    // Per-arena scores (see points.service TRACKS) and activity counters for badges.
    trackPoints: {
        learn: { type: Number, default: 0 },
        build: { type: Number, default: 0 },
        hire: { type: Number, default: 0 },
        apply: { type: Number, default: 0 },
    },
    lessonsDone: { type: Number, default: 0 },
    pathsDone: { type: Number, default: 0 },
    projectsSubmitted: { type: Number, default: 0 },
    upvotesReceived: { type: Number, default: 0 },
    missionsDone: { type: Number, default: 0 },
    reviewsGiven: { type: Number, default: 0 },
    shortlists: { type: Number, default: 0 },
    // Progress state: "pathId:stepIndex" checkpoints and completed mission ids.
    learned: { type: [String], default: [] },
    missions: { type: [String], default: [] },
    lastActiveAt: { type: Date, default: null },
    streak: { type: Number, default: 0 },
}, {
    timestamps: true,
});

// Leaderboard order.
userSchema.index({ points: -1, updatedAt: 1 });
for (const t of ['learn', 'build', 'hire', 'apply']) userSchema.index({ [`trackPoints.${t}`]: -1 });

export const User = mongoose.models.User || mongoose.model('User', userSchema);
