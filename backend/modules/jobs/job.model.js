import mongoose from 'mongoose';
import { CATEGORY_SLUGS } from '../../../frontend/src/content/jobCategories.js';

export const JOB_TYPES = ['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance'];
export const WORK_MODES = ['Remote', 'Hybrid', 'On-site'];
export const EXPERIENCE_LEVELS = ['Fresher', 'Junior', 'Mid', 'Senior'];

const jobSchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    company: { type: String, required: true, trim: true, maxlength: 120 },
    companyUrl: { type: String, default: '', trim: true },
    type: { type: String, enum: JOB_TYPES, required: true },
    workMode: { type: String, enum: WORK_MODES, required: true },
    experience: { type: String, enum: EXPERIENCE_LEVELS, required: true },
    location: { type: String, required: true, trim: true, maxlength: 120 },
    salary: { type: String, default: '', trim: true, maxlength: 80 },
    skills: { type: [String], default: [] },
    category: { type: String, enum: CATEGORY_SLUGS }, // set by categoryOf() unless the admin picks one
    description: { type: String, required: true, maxlength: 8000 },
    // Where "Apply" sends people. Empty = apply inside the site (application is stored here).
    applyUrl: { type: String, default: '', trim: true },
    deadline: { type: Date, default: null },
    // Reach-out kit (members only): the LinkedIn post this came from, its author, the company page, emails in the post.
    sourceUrl: { type: String, default: '', trim: true },
    poster: {
        name: { type: String, default: '', trim: true, maxlength: 80 },
        profileUrl: { type: String, default: '', trim: true },
    },
    companyLinkedin: { type: String, default: '', trim: true },
    contactEmails: { type: [String], default: [] },
    // Members who work at the company and offer to refer (members only).
    insiders: {
        type: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            note: { type: String, default: '', trim: true, maxlength: 200 },
            at: { type: Date, default: Date.now },
        }],
        default: [],
    },
    huntersCount: { type: Number, default: 0 }, // members who reached out — social proof on the card
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['open', 'closed'], default: 'open', index: true },
    views: { type: Number, default: 0 },
    applicantsCount: { type: Number, default: 0 },
}, {
    timestamps: true,
});

// Matches the list query: filter by status, newest first. Keeps the sort on the index, not in memory.
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ status: 1, category: 1, createdAt: -1 }); // category pages
// One listing per LinkedIn post, enforced by the DB so two admins pasting the same link can't both win.
jobSchema.index({ sourceUrl: 1 }, { unique: true, partialFilterExpression: { sourceUrl: { $gt: '' } } });

export const Job = mongoose.models.Job || mongoose.model('Job', jobSchema);

const applicationSchema = new mongoose.Schema({
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    note: { type: String, default: '', maxlength: 2000 },
    portfolioUrl: { type: String, default: '', trim: true },
    status: { type: String, enum: ['sent', 'viewed', 'shortlisted', 'rejected'], default: 'sent' },
}, {
    timestamps: true,
});

applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
applicationSchema.index({ applicant: 1, createdAt: -1 });

export const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema);

// A member's own pipeline for one job. Each stage pays once (see quest.js), so moving back and forth earns nothing.
export const QUEST_STAGES = ['saved', 'reached', 'replied', 'interview', 'offer'];
// Claiming these needs a proof link; their points land when an admin verifies it.
export const PROOF_STAGES = ['replied', 'interview', 'offer'];

const questSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    stage: { type: String, enum: QUEST_STAGES, required: true },
    stageAt: { saved: Date, reached: Date, replied: Date, interview: Date, offer: Date }, // first time each stage was reached
    verified: { type: String, enum: ['', ...PROOF_STAGES], default: '' }, // highest stage an admin has confirmed
    // The latest claim. Admin-only and owner-only: never shown to other members.
    proof: {
        stage: { type: String, enum: PROOF_STAGES },
        url: String,
        note: String,
        status: { type: String, enum: ['pending', 'verified', 'rejected'] },
        at: Date,
    },
}, {
    timestamps: true,
});

questSchema.index({ user: 1, job: 1 }, { unique: true });
questSchema.index({ user: 1, updatedAt: -1 });
questSchema.index({ verified: 1, updatedAt: -1 }); // wins feed
questSchema.index({ 'proof.status': 1, updatedAt: -1 }); // admin proof queue

export const Quest = mongoose.models.Quest || mongoose.model('Quest', questSchema);

// Members find jobs too; an admin turns a suggestion into a listing.
const suggestionSchema = new mongoose.Schema({
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    text: { type: String, required: true, maxlength: 20000 },
    sourceUrl: { type: String, default: '' }, // canonical LinkedIn post link, when the text has one
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    jobSlug: { type: String, default: '' },
}, {
    timestamps: true,
});

suggestionSchema.index({ status: 1, createdAt: -1 });

export const Suggestion = mongoose.models.Suggestion || mongoose.model('Suggestion', suggestionSchema);
