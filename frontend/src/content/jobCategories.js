// Job categories: one list for the classifier (backend), the filter chips, the
// /jobs/category/:slug landing pages and the sitemap. Plain JS so the backend can import it.

export const JOB_CATEGORIES = [
    {
        slug: 'frontend', name: 'Frontend', icon: '🎨',
        rx: /front[- ]?end|\breact(?:\.?js)?\b(?! native)|angular|\bvue|next\.?js|ui developer|javascript developer|\bhtml\b|\bcss\b|tailwind|typescript/,
        intro: 'React, Angular, Vue and Next.js roles for freshers and early-career developers who build what users see.',
    },
    {
        slug: 'backend', name: 'Backend', icon: '⚙️',
        rx: /back[- ]?end|node\.?js|express|django|flask|fastapi|spring|\bjava\b|golang|\bphp\b|laravel|\.net|c#|ruby|rails|microservices|api developer/,
        intro: 'Node.js, Java, Python, Go and PHP roles for developers who build APIs, databases and services.',
    },
    {
        slug: 'full-stack', name: 'Full Stack', icon: '🧱',
        rx: /full[- ]?stack|\bmern\b|\bmean\b|\bmevn\b/,
        intro: 'MERN, MEAN and full stack roles for developers who ship features end to end, from UI to database.',
    },
    {
        slug: 'mobile', name: 'Mobile', icon: '📱',
        rx: /android|\bios\b|flutter|react native|kotlin|swift|mobile (?:app|developer)/,
        intro: 'Android, iOS, Flutter and React Native roles for developers who build apps people carry around.',
    },
    {
        slug: 'data-ai', name: 'Data & AI', icon: '🧠',
        rx: /data (?:scien|analy|engineer)|machine learning|\bml\b|\bai\b|artificial intelligence|deep learning|\bnlp\b|\bllms?\b|gen ?ai|pytorch|tensorflow|pandas|power ?bi|tableau|analytics/,
        intro: 'Data analyst, data science, ML and GenAI roles for people who turn data into decisions and models.',
    },
    {
        slug: 'devops-cloud', name: 'DevOps & Cloud', icon: '☁️',
        rx: /devops|\bsre\b|site reliability|cloud engineer|\baws\b|azure|\bgcp\b|kubernetes|docker|terraform|ci\/cd|linux admin/,
        intro: 'DevOps, SRE and cloud roles on AWS, Azure and GCP for engineers who keep systems running.',
    },
    {
        slug: 'qa-testing', name: 'QA & Testing', icon: '🧪',
        rx: /\bqa\b|quality assurance|\btest(?:ing|er)\b|\bsdet\b|selenium|cypress|playwright|automation test/,
        intro: 'Manual and automation testing, QA and SDET roles for people who catch bugs before users do.',
    },
    {
        slug: 'design', name: 'UI/UX Design', icon: '✏️',
        rx: /ui\/ux|ux designer|ui designer|product designer|graphic designer|\bfigma\b|user experience/,
        intro: 'UI, UX and product design roles for designers who make software easy to use.',
    },
    {
        slug: 'security', name: 'Cybersecurity', icon: '🛡️',
        rx: /cyber ?security|security (?:analyst|engineer)|penetration|pentest|\bsoc\b|ethical hack|\bvapt\b/,
        intro: 'Security analyst, SOC, VAPT and application security roles for people who protect systems.',
    },
    {
        slug: 'marketing-content', name: 'Marketing & Content', icon: '📣',
        rx: /marketing|social media|content (?:writer|creator|strateg|marketing)|copywrit|\bseo\b|creative (?:intern|strategist|lead)|video editor|brand|growth|community manager/,
        intro: 'Marketing, social media, content, SEO and creative roles for people who get products noticed.',
    },
    {
        slug: 'business-ops', name: 'Business & Ops', icon: '📊',
        rx: /product manager|business (?:analyst|development)|\bsales\b|\bbde\b|\bhr\b|human resources|recruit|talent acquisition|operations|customer success|account manager|finance/,
        intro: 'Product, business analyst, sales, HR, recruiting and operations roles at tech companies.',
    },
    {
        slug: 'software-engineering', name: 'Software Engineering', icon: '💻',
        rx: /software (?:engineer|developer)|\bsde\b|programmer|graduate engineer|trainee engineer/,
        intro: 'SDE, software engineer and graduate trainee roles where you work across the stack.',
    },
];

export const CATEGORY_SLUGS = JOB_CATEGORIES.map((c) => c.slug);

// Shared with the backend: job URLs, /jobs/company/:slug and /jobs/in/:slug all use it.
export const slugify = (text) => String(text ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

/** /jobs/skill/:slug key: every spelling of a skill lands on one page ("React", "ReactJS", "react.js" → "react"; "C++" → "cplusplus"). */
export const skillSlug = (skill) => slugify(String(skill ?? '').replace(/\+/g, 'plus').replace(/#/g, 'sharp')).replace(/-?js$/, (m, i) => (i >= 3 ? '' : m));

// Place pages (/jobs/in/:slug). `names` are every spelling a job's location may use.
export const CITIES = [
    ['Remote', ['Remote']], ['Bengaluru', ['Bengaluru', 'Bangalore']], ['Hyderabad', ['Hyderabad']], ['Pune', ['Pune']],
    ['Mumbai', ['Mumbai', 'Bombay']], ['Delhi', ['Delhi', 'New Delhi', 'NCR']], ['Noida', ['Noida']], ['Gurugram', ['Gurugram', 'Gurgaon']],
    ['Chennai', ['Chennai']], ['Kolkata', ['Kolkata']], ['Ahmedabad', ['Ahmedabad']],
].map(([name, names]) => ({ slug: slugify(name), name, names }));
export const cityBySlug = (slug) => CITIES.find((c) => c.slug === slug) ?? null;
/** "Intern at Honeywell — Internship, Pune", leaving out what the post didn't say. */
/** "Not available" and the hand-typed ways of saying it ("Not avaiable", "N/A", "-"). */
export const isPlaceholder = (s) => !String(s ?? '').trim() || /^(?:not ava\w*|n\/?a|-+|confidential)$/i.test(String(s).trim());
const known = (s) => (isPlaceholder(s) ? '' : s);
const remoteTitle = (job) => (job.workMode === 'Remote' && !/remote/i.test(job.title) ? `Remote ${job.title}` : job.title);
const placeOf = (job) => {
    if (job.workMode === 'Remote') return '';
    const place = cityOf(job.location)?.name || known(job.location).split(/[,(]/)[0].trim();
    // A location that just repeats the company name ("Bestpeers Infosystem Pvt. Ltd") is not a place.
    const company = known(job.company).toLowerCase().slice(0, 8);
    return place && !(company && place.toLowerCase().startsWith(company)) ? place : '';
};

/**
 * The search-result title, worded the way people search: "Razorpay hiring Remote React Developer Intern · ₹30K/month".
 * Company, role and city lead so a cut-off title still matches; the hook (pay, else fresher/type) goes only if it fits.
 */
export const jobHeadline = (job) => {
    const company = known(job.company);
    const place = placeOf(job);
    const head = `${company ? `${company} hiring` : 'Hiring'} ${remoteTitle(job)}${place ? ` in ${place}` : ''}`;
    const fresher = job.experience === 'Fresher' && !/fresher|intern/i.test(job.title) ? (job.type === 'Internship' ? 'Internship' : 'Freshers') : '';
    const hook = job.salary || fresher;
    return hook && head.length + hook.length + 3 <= 70 ? `${head} · ${hook}` : head;
};

/** Company and city page titles, worded like the search ("razorpay internship 2026", "remote developer jobs for freshers"). Shared so the crawler HTML and the app agree. */
export const listPageTitle = ({ company, city, skill }, year = new Date().getFullYear()) => (company
    ? `${company} Careers ${year}: Jobs & Internships for Freshers`
    : skill
    ? `${skill} Jobs & Internships for Freshers ${year}`
    : city.slug === 'remote'
        ? `Remote Developer Jobs & Internships for Freshers ${year}`
        : `Developer Jobs & Internships in ${city.name} for Freshers ${year}`);

/**
 * Copy unique to one company page, built from its open jobs: the meta description and answers to what people
 * search ("is Razorpay hiring", "Razorpay internship", "Razorpay jobs for freshers"). Shared by the crawler HTML and the app.
 * Every answer states this company's own facts; a line that would read the same on every company page does not belong here.
 */
export const companyPage = (company, jobs) => {
    const uniq = (xs) => [...new Set(xs.map(known).filter(Boolean))];
    const roles = uniq(jobs.map((j) => j.title));
    const places = uniq(jobs.map((j) => (j.workMode === 'Remote' ? 'Remote' : placeOf(j))));
    const pay = uniq(jobs.map((j) => j.salary));
    const interns = jobs.filter((j) => j.type === 'Internship').length;
    const freshers = jobs.filter((j) => j.experience === 'Fresher').length;
    const n = jobs.length;
    const top = roles.slice(0, 3).join(', ');
    const where = places.length ? ` in ${places.slice(0, 3).join(', ')}` : '';
    const latest = n ? new Date(Math.max(...jobs.map((j) => new Date(j.createdAt)))).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    const faq = [
        { q: `Is ${company} hiring right now?`, a: n ? `Yes. ${company} has ${n} open role${n > 1 ? 's' : ''} on The Consistent Coders: ${top}. The latest was posted on ${latest}.` : `${company} has no open roles here right now.` },
        { q: `Does ${company} hire freshers?`, a: freshers ? `Yes. ${freshers} open ${company} role${freshers > 1 ? 's are' : ' is'} open to freshers with no work experience.` : `The open ${company} roles ask for some experience: ${uniq(jobs.map((j) => j.experience)).join(', ')}.` },
        { q: `Does ${company} offer internships?`, a: interns ? `Yes. ${company} has ${interns} open internship${interns > 1 ? 's' : ''}.` : `${company} has no open internship right now, only ${uniq(jobs.map((j) => j.type)).join(' and ').toLowerCase()} roles.` },
        ...(places.length ? [{ q: `Where are ${company} jobs located?`, a: `Open ${company} roles are ${places.map((p) => (p === 'Remote' ? 'remote' : `in ${p}`)).join(', ')}.` }] : []),
        ...(pay.length ? [{ q: `What salary does ${company} pay?`, a: `Listed pay for open ${company} roles: ${pay.slice(0, 4).join(', ')}.` }] : []),
    ];
    const description = `${company} is hiring: ${n} open role${n === 1 ? '' : 's'}${interns ? ` (${interns} internship${interns > 1 ? 's' : ''})` : ''}${where}${top ? `, including ${top}` : ''}. Apply free on The Consistent Coders and get referred.`;
    return { description, faq };
};

/** The meta description: the same facts as a sentence, then the opening of the post, kept under ~160 chars. */
export const jobSummary = (job) => {
    const company = known(job.company);
    const place = placeOf(job);
    const facts = `${company ? `${company} is hiring` : 'Hiring'} a ${remoteTitle(job)} (${[job.type, job.experience].filter(Boolean).join(', ')})${place ? ` in ${place}` : ''}.${job.salary ? ` ${job.salary}.` : ''}`;
    const room = Math.max(0, 150 - facts.length - 30);
    const lead = room > 30 ? ` ${String(job.description ?? '').replace(/\s+/g, ' ').slice(0, room).replace(/\s+\S*$/, '').replace(/[\s.,;:!–-]+$/, '')}…` : '';
    return `${facts}${lead} Apply free on The Consistent Coders.`;
};
/** The city page a job's location belongs to, if any ("Bangalore, India" → Bengaluru). */
export const cityOf = (location) => CITIES.find((c) => c.names.some((n) => new RegExp(`\\b${n}\\b`, 'i').test(location ?? ''))) ?? null;
export const FALLBACK_CATEGORY = 'software-engineering';
export const categoryBySlug = (slug) => JOB_CATEGORIES.find((c) => c.slug === slug) ?? null;

/**
 * Pick the best category for a job. The title counts most, then skills, then the description.
 * ponytail: keyword scoring, no ML. Wrong picks are fixed by the admin's category select; add rules here when a pattern repeats.
 */
export const categoryOf = ({ title = '', skills = [], description = '', company = '' }) => {
    // The company's name says nothing about the role: "August AI" hiring a writer is not an AI job.
    const co = String(company).trim().toLowerCase();
    const norm = (s) => { const t = String(s).toLowerCase(); return co.length > 1 ? t.split(co).join(' ') : t; };
    const parts = [[norm(title), 5], [skills.join(' · ').toLowerCase(), 2], [norm(description), 1]];
    const score = Object.fromEntries(JOB_CATEGORIES.map((c) => [c.slug, parts.reduce((n, [text, w]) => n + (c.rx.test(text) ? w : 0), 0)]));
    // A title naming both ends ("React + Node developer") is full stack even without the words.
    if (score.frontend >= 5 && score.backend >= 5) score['full-stack'] = Math.max(score.frontend, score.backend) + 1;
    const [best, points] = Object.entries(score).sort((a, b) => b[1] - a[1])[0];
    return points >= 2 ? best : FALLBACK_CATEGORY;
};
