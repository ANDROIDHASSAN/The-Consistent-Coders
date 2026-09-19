import mongoose from 'mongoose';

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
    description: { type: String, required: true, maxlength: 8000 },
    // Where "Apply" sends people. Empty = apply inside the site (application is stored here).
    applyUrl: { type: String, default: '', trim: true },
    deadline: { type: Date, default: null },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['open', 'closed'], default: 'open', index: true },
    views: { type: Number, default: 0 },
    applicantsCount: { type: Number, default: 0 },
}, {
    timestamps: true,
});

// Matches the list query: filter by status, newest first. Keeps the sort on the index, not in memory.
jobSchema.index({ status: 1, createdAt: -1 });

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
