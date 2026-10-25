// JobPosting helpers shared by the SPA (Seo.jsx) and the crawler renderer (seo.service.js). Plain JS so the backend can import it.
import { isPlaceholder } from './jobCategories.js';

const escapeHtml = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const EMPLOYMENT = { 'Full-time': 'FULL_TIME', 'Part-time': 'PART_TIME', Internship: 'INTERN', Contract: 'CONTRACTOR', Freelance: 'CONTRACTOR' };

/**
 * Google bans JobPosting markup on incomplete descriptions (a one-line WhatsApp forward). Such a page stays up, without the markup.
 * ponytail: a length cut-off, not a check for responsibilities/qualifications; tune 200 if real posts get caught.
 */
export const hasFullDescription = (job) => String(job.description ?? '').trim().length >= 200;

/** Google's JobPosting, one builder for the app and the crawler HTML so the two never drift. */
export const jobPostingSchema = (job, siteUrl, siteName) => {
    const sameAs = job.companyUrl || job.companyLinkedin;
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: job.title,
        description: `<p>${escapeHtml(job.description).replace(/\n+/g, '</p><p>')}</p>`,
        datePosted: new Date(job.createdAt).toISOString(),
        employmentType: EMPLOYMENT[job.type] ?? 'OTHER',
        // hiringOrganization is required; an unnamed employer is what job boards call "Confidential".
        hiringOrganization: { '@type': 'Organization', name: isPlaceholder(job.company) ? 'Confidential' : job.company, ...(sameAs ? { sameAs } : {}) },
        jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: job.location, ...(countryOf(job.location) ? { addressCountry: countryOf(job.location) } : {}) } },
        directApply: !job.applyUrl,
        url: `${siteUrl}/jobs/${job.slug}`,
        identifier: { '@type': 'PropertyValue', name: siteName, value: job.slug },
    };
    if (job.workMode === 'Remote') {
        schema.jobLocationType = 'TELECOMMUTE';
        schema.applicantLocationRequirements = { '@type': 'Country', name: 'India' };
    }
    // Fresher roles: Google's "no experience" filter reads monthsOfExperience 0.
    if (job.experience === 'Fresher') schema.experienceRequirements = { '@type': 'OccupationalExperienceRequirements', monthsOfExperience: 0 };
    if (job.deadline) schema.validThrough = new Date(job.deadline).toISOString();
    if (job.skills?.length) schema.skills = job.skills.join(', ');
    const baseSalary = baseSalarySchema(job.salary);
    if (baseSalary) schema.baseSalary = baseSalary;
    // Fully remote: Google wants applicantLocationRequirements, not a "Remote" street address. Unknown place: no address at all.
    if ((job.workMode === 'Remote' && /remote/i.test(job.location)) || isPlaceholder(job.location)) delete schema.jobLocation;
    return schema;
};

// ponytail: India + a few US/UK spellings; unknown places get no addressCountry rather than a wrong one.
const INDIA = /\bindia\b|bengaluru|bangalore|mumbai|pune|hyderabad|delhi|noida|gurgaon|gurugram|chennai|kolkata|ahmedabad|jaipur|indore|chandigarh|kochi|thiruvananthapuram|bhopal|nagpur|surat|lucknow|coimbatore|mysuru/i;
export const countryOf = (location) => {
    const s = String(location ?? '');
    if (INDIA.test(s)) return 'IN';
    if (/\b(?:usa|united states|[A-Z][a-z]+, (?:A[KLRZ]|C[AOT]|D[CE]|FL|GA|HI|I[ADLN]|K[SY]|LA|M[ADEINOST]|N[CDEHJMVY]|O[HKR]|PA|RI|S[CD]|T[NX]|UT|V[AT]|W[AIVY]))\b/.test(s)) return 'US';
    if (/\b(?:uk|united kingdom|london)\b/i.test(s)) return 'GB';
    return /^remote/i.test(s) ? 'IN' : ''; // "Remote" / "Remote (India)": the board's audience
};

// "₹20,000–35,000 per month" → { min: 20000, max: 35000, unit: 'MONTH' } for JobPosting.baseSalary.
// Google wants numbers plus a unit; a free-text value is flagged invalid.

const MULT = { k: 1e3, l: 1e5, lpa: 1e5, lakh: 1e5, lakhs: 1e5, cr: 1e7 };

export const salaryRange = (raw) => {
    const s = String(raw ?? '').toLowerCase();
    const unit = /month|\/mo\b|\bpm\b|stipend/.test(s) ? 'MONTH'
        : /lpa|lakh|\bl\b|annum|year|\/yr|\bpa\b|ctc|\bcr\b/.test(s) ? 'YEAR'
            : /hour|\/hr/.test(s) ? 'HOUR' : '';
    const nums = [...s.matchAll(/(\d[\d,]*(?:\.\d+)?)\s*(k|lpa|lakhs?|l|cr)?\b/g)].slice(0, 2);
    if (!unit || nums.length === 0) return null; // unknown shape: better no salary than a wrong one
    // "6–8 LPA": the suffix on the second number applies to a small first one too (not "20,000–35k").
    const suffix = nums.at(-1)[2];
    const [min, max] = nums.map(([, n, sfx]) => {
        const v = Number(n.replace(/,/g, ''));
        return v * (MULT[sfx ?? (v < 1000 ? suffix : '')] ?? 1);
    });
    if (!min || Number.isNaN(min)) return null;
    return { min, max: max && max >= min ? max : min, unit };
};

export const baseSalarySchema = (raw) => {
    const r = salaryRange(raw);
    if (!r) return null;
    return {
        '@type': 'MonetaryAmount',
        currency: 'INR',
        value: r.max > r.min
            ? { '@type': 'QuantitativeValue', minValue: r.min, maxValue: r.max, unitText: r.unit }
            : { '@type': 'QuantitativeValue', value: r.min, unitText: r.unit },
    };
};
