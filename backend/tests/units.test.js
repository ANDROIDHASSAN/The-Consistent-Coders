// Run: node --test backend/tests   (no database needed)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isExpired, openFilter, parseJobInput, reachOutFor, toPublicJob } from '../modules/jobs/job.service.js';
import { needsProof, proofUrl, rulesUpTo } from '../modules/jobs/job.quest.js';
import { extractJobFromText, extractJobFromUrl, linkedinPost, linkedinPostDate, ogText } from '../modules/jobs/job.extract.js';
import { countryOf, salaryRange } from '../../frontend/src/content/jobSchema.js';
import { rankFor, badgesFor, levelFor, arenasFor, POINT_RULES, TRACKS } from '../modules/points/points.service.js';
import { learningSummary, PATHS } from '../modules/learn/learn.routes.js';
import { buildSitemap, renderJobPage, renderListPage } from '../modules/seo/seo.service.js';
import { env } from '../config/env.js';
import { categoryOf, cityOf, companyPage, listPageTitle, skillSlug } from '../../frontend/src/content/jobCategories.js';

test('jobs categorise themselves from title, skills and description', () => {
    const cases = [
        [{ title: 'React Developer Intern', skills: ['React', 'CSS'] }, 'frontend'],
        [{ title: 'Backend Engineer (Node.js)', skills: ['Node.js', 'MongoDB'] }, 'backend'],
        [{ title: 'MERN Stack Developer' }, 'full-stack'],
        [{ title: 'React + Node.js Developer' }, 'full-stack'],
        [{ title: 'Flutter Developer', skills: ['Flutter', 'Dart'] }, 'mobile'],
        [{ title: 'React Native Developer' }, 'mobile'],
        [{ title: 'Data Analyst Intern', skills: ['SQL', 'Power BI'] }, 'data-ai'],
        [{ title: 'DevOps Engineer', skills: ['AWS', 'Docker'] }, 'devops-cloud'],
        [{ title: 'QA Automation Engineer', skills: ['Selenium'] }, 'qa-testing'],
        [{ title: 'UI/UX Designer', skills: ['Figma'] }, 'design'],
        [{ title: 'SOC Analyst' }, 'security'],
        [{ title: 'Java Developer' }, 'backend'],
        [{ title: 'JavaScript Developer' }, 'frontend'],
        [{ title: 'Software Engineer', description: 'Join our team.' }, 'software-engineering'],
        [{ title: 'Associate', description: 'Great culture.' }, 'software-engineering'],
    ];
    for (const [job, want] of cases) assert.equal(categoryOf(job), want, job.title);
    // The company name is not the role.
    assert.equal(categoryOf({ title: 'Creative Intern & Social Media Writer Intern', company: 'August AI', description: 'Our AI helps people.' }), 'marketing-content');
    assert.equal(categoryOf({ title: 'HR Intern', company: 'Acme' }), 'business-ops');
});

// A real multi-role LinkedIn post (og:title is its cut-off opening + " | Author", og:description the whole post).
const AUGUST_DESC = `We’re hiring 2 interns at August AI, Bengaluru.

About August AI

Healthcare is broken. We are building AI to change it.

Our AI helps people understand their health, find doctors, check insurance coverage, book appointments, and get medical care.

 Creative Intern

Think of bold ideas for video and static ads.
Work on new creative projects across the company.

 Social Media Writer Intern

Write hooks that make people stop scrolling.
Build a distinct voice that people want to follow.

What you get

 Bengaluru | In-office
 ₹20,000–35,000 per month
 Own real projects. See your work go live.

How to apply
Fill out the form in the comments.`;
const AUGUST_TITLE = 'We’re hiring 2 interns at August AI, Bengaluru. \n\nAbout August AI\n\nHealthcare is broken. We are building AI to change it.\n\nOur… | Animesh Mishra';

test('a multi-role LinkedIn post becomes a clean draft', () => {
    const text = ogText(AUGUST_TITLE, AUGUST_DESC, 'Animesh Mishra');
    assert.equal(text, AUGUST_DESC, 'the cut-off og:title is not repeated above the post');
    const d = extractJobFromText(text);
    assert.equal(d.title, 'Creative Intern & Social Media Writer Intern');
    assert.equal(d.company, 'August AI');
    assert.equal(d.salary, '₹20,000–35,000 per month');
    assert.deepEqual(d.skills, ['Social Media'], '"go live" is not Go, "doctors," is not a salary');
    assert.equal(d.type, 'Internship');
    assert.equal(d.workMode, 'On-site');
    assert.equal(d.location, 'Bengaluru');
    assert.equal(categoryOf(d), 'marketing-content');
    // Headings only: a sentence that ends in a role is not one.
    assert.equal(extractJobFromText('Join us!\nReport to the Engineering Manager\nMore below and stuff here.').title, 'Join us!');
    // A title that adds something is kept.
    assert.equal(ogText('Backend Developer at Acme', 'Node.js role, 2 yrs.'), 'Backend Developer at Acme\n\nNode.js role, 2 yrs.');
});

test('the title drops the company in front and the work mode behind it', () => {
    const draft = extractJobFromText(ogText('Klimb, Associate Product Manager, Remote | Anmol kaur', 'We are growing and looking for people to join our team at Klimb. Fully remote internship.', 'Anmol kaur'));
    assert.equal(draft.company, 'Klimb');
    assert.equal(draft.title, 'Associate Product Manager');
    assert.equal(draft.workMode, 'Remote');
    assert.equal(extractJobFromText('Remote\nWork from home role at Acme.').title, 'Remote', 'a title that is only the mode stays');
});

test('salary text becomes a number range Google accepts', () => {
    assert.deepEqual(salaryRange('₹20,000–35,000 per month'), { min: 20000, max: 35000, unit: 'MONTH' });
    assert.deepEqual(salaryRange('₹6–8 LPA'), { min: 600000, max: 800000, unit: 'YEAR' });
    assert.deepEqual(salaryRange('₹15K/month'), { min: 15000, max: 15000, unit: 'MONTH' });
    assert.deepEqual(salaryRange('Stipend 10k-15k'), { min: 10000, max: 15000, unit: 'MONTH' });
    assert.equal(salaryRange('Competitive'), null);
    assert.equal(salaryRange('30000 - 50000'), null, 'no unit: leave it out rather than guess');
});

test('addressCountry only when the place is known', () => {
    assert.equal(countryOf('Bangalore'), 'IN');
    assert.equal(countryOf('Bellevue, WA (Onsite)'), 'US');
    assert.equal(countryOf('Indianapolis, IN'), 'US');
    assert.equal(countryOf('Berlin'), '');
});

test('LinkedIn bold headings read as text; missing company/place say "Not available"', () => {
    const bold = (s) => [...s].map((c) => (/[A-Z]/.test(c) ? String.fromCodePoint(0x1D400 + c.charCodeAt(0) - 65) : c)).join('');
    const r = extractJobFromText(`${bold('HONEYWELL AEROSPACE IS HIRING!')}\n\nApply :- https://lnkd.in/gdyQXpHR\n\nRole: Intern Bachelors Software Eng`);
    assert.equal(r.company, 'Honeywell Aerospace');
    assert.equal(r.title, 'Intern Bachelors Software Eng');
    assert.equal(r.location, 'Not available');
    assert.equal(extractJobFromText('Hiring now!\nApply: https://x.co/a\nRole: Backend Engineer').company, 'Not available');
});

test('hashtag-only og:title is dropped, hashtag lines leave the description', () => {
    const desc = 'We are hiring a React Developer Intern at Acme Labs in Pune.\nStipend ₹15K/month.\n#hiring #react #internship';
    assert.equal(ogText('#hiring #react', desc, 'Some Poster'), desc);
    assert.doesNotMatch(extractJobFromText(desc).description, /#hiring/);
});

const site = env.siteUrl.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

const validJob = {
    title: 'React Developer Intern',
    company: 'Acme Labs',
    type: 'Internship',
    workMode: 'Remote',
    experience: 'Fresher',
    location: 'Remote (India)',
    salary: '₹15K/month',
    skills: 'React, Node.js, , MongoDB',
    description: 'Build the dashboard in React with a small team. You will ship weekly, review PRs and own one feature end to end. You know JavaScript, React hooks and CSS, and you have built one project of your own. Final-year students welcome.',
    applyUrl: 'https://acme.example/apply',
};

test('parseJobInput accepts a valid job and normalises skills', () => {
    const { data, error } = parseJobInput(validJob);
    assert.equal(error, undefined);
    assert.deepEqual(data.skills, ['React', 'Node.js', 'MongoDB']);
    assert.equal(data.deadline, null);
});

test('parseJobInput rejects bad enum, short description and bad apply link', () => {
    assert.match(parseJobInput({ ...validJob, type: 'Gig' }).error, /Job type/);
    assert.match(parseJobInput({ ...validJob, description: 'too short' }).error, /80 characters/);
    assert.match(parseJobInput({ ...validJob, applyUrl: 'acme.example' }).error, /http/);
    assert.equal(parseJobInput({ ...validJob, applyUrl: 'mailto:hr@acme.example' }).error, undefined);
});

test('rankFor walks the tiers and reports the next one', () => {
    assert.deepEqual(rankFor(0), { name: 'Rookie', next: { name: 'Contributor', min: 5 } });
    assert.deepEqual(rankFor(15), { name: 'Builder', next: { name: 'Architect', min: 40 } });
    assert.deepEqual(rankFor(500), { name: 'Legend', next: null });
    assert.deepEqual([POINT_RULES.job_posted.points, POINT_RULES.job_posted.track], [1, 'hire']);
    assert.deepEqual([POINT_RULES.job_applied.points, POINT_RULES.job_applied.track], [1, 'apply']);
    for (const rule of Object.values(POINT_RULES)) assert.ok([...TRACKS, 'general'].includes(rule.track), `bad track ${rule.track}`);
});

test('badgesFor unlocks by milestones across arenas', () => {
    const ids = badgesFor({ points: 40, jobsPosted: 5, applicationsSent: 1, streak: 7, pathsDone: 1, lessonsDone: 4, upvotesReceived: 5 }).map((b) => b.id);
    assert.deepEqual(ids, ['first_post', 'recruiter', 'first_apply', 'first_lesson', 'path_complete', 'crowd_favourite', 'streak_3', 'streak_7', 'architect']);
    assert.deepEqual(badgesFor({}), [], 'new member has no badges');
});

test('levelFor maps arena points to levels 1–10 with progress', () => {
    assert.deepEqual(levelFor(0), { level: 1, floor: 0, next: 3, progress: 0 });
    assert.deepEqual(levelFor(10), { level: 3, floor: 8, next: 15, progress: 29 });
    assert.equal(levelFor(500).level, 10);
    assert.equal(levelFor(500).progress, 100);
    assert.deepEqual(Object.keys(arenasFor({ trackPoints: { learn: 9 } })), TRACKS);
    assert.equal(arenasFor({ trackPoints: { learn: 9 } }).learn.level, 3);
});

test('learningSummary marks checkpoints and completed paths', () => {
    const first = PATHS[0];
    const keys = Array.from({ length: first.steps }, (_, i) => `${first.id}:${i}`);
    const s = learningSummary([...keys, `${PATHS[1].id}:0`]);
    assert.equal(s[0].completed, true);
    assert.deepEqual(s[1].done.slice(0, 2), [true, false]);
    assert.equal(s[1].completed, false);
    assert.equal(PATHS.length, 9);
});

test('buildSitemap lists static, blog and job URLs', () => {
    const xml = buildSitemap({
        staticRoutes: [{ path: '/', priority: '1.0' }, { path: '/jobs' }],
        blogSlugs: [{ slug: 'hello' }],
        jobs: [{ slug: 'react-dev-acme', updatedAt: '2026-09-01T00:00:00Z' }],
    });
    assert.match(xml, new RegExp(`<loc>${site}/jobs</loc>`));
    assert.match(xml, /\/blog\/hello<\/loc>/);
    assert.match(xml, /\/jobs\/react-dev-acme<\/loc>/);
    assert.equal((xml.match(/<url>/g) || []).length, 4);
    // lastmod only where the real change date is known; no changefreq/priority.
    assert.match(xml, /react-dev-acme<\/loc><lastmod>2026-09-01T00:00:00.000Z<\/lastmod>/);
    assert.match(xml, new RegExp(`<loc>${site}/jobs</loc></url>`));
    assert.doesNotMatch(xml, /changefreq|priority/);
});

test('renderJobPage injects title, JobPosting JSON-LD and crawlable body; closed jobs get noindex', () => {
    const shell = '<html><head><title>x</title><meta name="description" content="old" /></head><body><div id="root"></div><script src="/a.js"></script></body></html>';
    const job = {
        ...validJob, slug: 'react-developer-intern-acme-labs', skills: ['React'], status: 'open',
        createdAt: '2026-09-01T00:00:00Z', deadline: null, companyUrl: '',
    };
    const html = renderJobPage(shell, job);
    assert.match(html, /<title>Acme Labs hiring Remote React Developer Intern · ₹15K\/month \| The Consistent Coders<\/title>/);
    assert.equal((html.match(/<title>/g) || []).length, 1, 'old title stripped');
    assert.match(html, new RegExp(`og:image" content="${site}/api/seo/og/job/react-developer-intern-acme-labs\\.png\\?v=\\d+"`), 'a shared link shows this job\'s own card');
    assert.match(html, /"@type":"JobPosting"/);
    assert.match(html, /"jobLocationType":"TELECOMMUTE"/);
    assert.match(html, /<h1>React Developer Intern<\/h1>/);
    assert.match(html, new RegExp(`rel="canonical" href="${site}/jobs/react-developer-intern-acme-labs"`));

    const hostile = renderJobPage(shell, { ...job, title: 'x</script><script>alert(1)</script>', description: job.description + ' </script><img src=x onerror=alert(1)>' });
    assert.doesNotMatch(hostile, /<\/script><script>alert/, 'script breakout blocked in JSON-LD');
    assert.doesNotMatch(hostile, /<img src=x/, 'HTML escaped in body');

    const closed = renderJobPage(shell, { ...job, status: 'closed' });
    assert.match(closed, /noindex/);
    assert.doesNotMatch(closed, /JobPosting/);

    // A one-line forward is an incomplete description: page stays indexable, without JobPosting markup.
    const thin = renderJobPage(shell, { ...job, description: 'Hiring React intern, DM me.' });
    assert.doesNotMatch(thin, /JobPosting/);
    assert.doesNotMatch(thin, /noindex/);

    assert.match(html, /href="\/jobs\/company\/acme-labs"/, 'job links to its company page');
    assert.match(html, /"experienceRequirements":\{"@type":"OccupationalExperienceRequirements","monthsOfExperience":0\}/, 'fresher roles say so to Google');
    assert.match(html, /<dt>Posted<\/dt><dd><time datetime="2026-09-01">/);
    const withRelated = renderJobPage(shell, job, [{ slug: 'node-intern-zeta', title: 'Node Intern', company: 'Zeta', workMode: 'Remote', location: 'Remote', type: 'Internship', experience: 'Fresher' }]);
    assert.match(withRelated, /<h2>Similar jobs<\/h2>\s*<ul><li><a href="\/jobs\/node-intern-zeta">Zeta hiring Remote Node Intern<\/a>/);
    assert.doesNotMatch(html, /Similar jobs/, 'no empty section');
    assert.match(renderJobPage(shell, { ...job, company: 'N/A' }), /"hiringOrganization":\{"@type":"Organization","name":"Confidential"\}/);
    const unknown = renderJobPage(shell, { ...job, company: 'Not avaiable', location: 'Not available', workMode: 'On-site', salary: '' });
    assert.match(unknown, /<title>Hiring React Developer Intern \| The Consistent Coders<\/title>/, '"Not available" and its typos stay out of the title');
    assert.doesNotMatch(unknown, /content="[^"]*Not ava/, '…and out of the meta description');
    const city = renderJobPage(shell, { ...job, title: 'Flutter Developer', type: 'Full-time', workMode: 'On-site', location: 'Bangalore, India', salary: '' });
    assert.match(city, /<title>Acme Labs hiring Flutter Developer in Bengaluru · Freshers \|/, 'city spelled the way the city page spells it');
    assert.doesNotMatch(unknown, /jobLocation"|\/jobs\/company\/not-available/);
});

test('programmatic list pages: ItemList, city links, noindex when empty', () => {
    const shell = '<html><head><title>x</title></head><body><div id="root"></div></body></html>';
    const jobs = [{ ...validJob, slug: 'a-job', company: 'Acme Labs' }];
    const html = renderListPage(shell, { path: '/jobs/in/pune', heading: 'Developer jobs & internships in Pune', crumb: 'Pune', description: 'd', jobs, siblings: [{ path: '/jobs/in/remote', name: 'Remote jobs' }] });
    assert.match(html, /"@type":"ItemList"/);
    assert.match(html, /<h1>Developer jobs &amp; internships in Pune<\/h1>/);
    assert.match(html, /href="\/jobs\/a-job"/);
    assert.match(html, /href="\/jobs\/in\/remote"/);
    assert.match(html, /index, follow/);
    assert.match(renderListPage(shell, { path: '/jobs/in/pune', heading: 'h', crumb: 'Pune', description: 'd', jobs: [] }), /noindex/);
    assert.equal(listPageTitle({ company: 'Razorpay' }, 2026), 'Razorpay Careers 2026: Jobs & Internships for Freshers');
    assert.equal(listPageTitle({ skill: 'React' }, 2026), 'React Jobs & Internships for Freshers 2026');
    assert.deepEqual(['React', 'ReactJS', 'react.js', 'Node.js', 'JS', 'C++', 'C#', 'CI/CD', 'Agentic AI', '++'].map(skillSlug),
        ['react', 'react', 'react', 'node', 'js', 'cplusplus', 'csharp', 'ci-cd', 'agentic-ai', 'plusplus']);
    assert.match(renderListPage(shell, { path: '/jobs/skill/react', heading: 'h', crumb: 'React', description: 'd', jobs, noindex: true }), /noindex/);
    const rz = companyPage('Razorpay', [
        { title: 'SDE Intern', type: 'Internship', experience: 'Fresher', workMode: 'Remote', location: 'Remote', salary: '₹40K/month', createdAt: '2026-10-20' },
        { title: 'Backend Engineer', type: 'Full-time', experience: '1-3 years', workMode: 'On-site', location: 'Bengaluru', salary: '', createdAt: '2026-10-01' },
    ]);
    assert.match(rz.description, /^Razorpay is hiring: 2 open roles \(1 internship\) in Remote, Bengaluru, including SDE Intern, Backend Engineer/);
    assert.deepEqual(rz.faq.map((f) => f.q), ['Is Razorpay hiring right now?', 'Does Razorpay hire freshers?', 'Does Razorpay offer internships?', 'Where are Razorpay jobs located?', 'What salary does Razorpay pay?']);
    assert.match(rz.faq[0].a, /2 open roles.*20 Oct 2026/);
    const rzHtml = renderListPage(shell, { path: '/jobs/company/razorpay', heading: 'h', crumb: 'Razorpay', description: rz.description, jobs, faq: rz.faq });
    assert.match(rzHtml, /<h3>Does Razorpay offer internships\?<\/h3>/);
    assert.doesNotMatch(rzHtml, /FAQPage/);
    assert.equal(listPageTitle({ city: { slug: 'remote', name: 'Remote' } }, 2026), 'Remote Developer Jobs & Internships for Freshers 2026');
    assert.equal(listPageTitle({ city: { slug: 'pune', name: 'Pune' } }, 2026), 'Developer Jobs & Internships in Pune for Freshers 2026');
    assert.equal(cityOf('Bangalore, Karnataka')?.slug, 'bengaluru');
    assert.equal(cityOf('Berlin'), null);
});

test('extractJobFromText fills the form from WhatsApp-style posts', () => {
    const a = extractJobFromText(`🚨 *Hiring - Backend Engineer (Freshers)*

Company: Work360

Skills: Java / Python / Node.js

Qualification: Bachelor's or Master's degree

👉 Apply here: https://tinyurl.com/4heea5m8`);
    assert.equal(a.title, 'Backend Engineer');
    assert.equal(a.company, 'Work360');
    assert.deepEqual(a.skills, ['Java', 'Python', 'Node.js']);
    assert.equal(a.experience, 'Fresher');
    assert.equal(a.type, 'Full-time');
    assert.equal(a.applyUrl, 'https://tinyurl.com/4heea5m8');

    const b = extractJobFromText(`💼 GoQuant is Hiring

• Role: *Back End Developer*

Skills: C++ / Rust / Python

Experience: Freshers / Experienced

👉 Apply here: https://tinyurl.com/fx48rnty`);
    assert.equal(b.title, 'Back End Developer');
    assert.equal(b.company, 'GoQuant');
    assert.deepEqual(b.skills, ['C++', 'Rust', 'Python']);

    // LinkedIn link preview (og:title + og:description)
    const c = extractJobFromText(`I am running a search for a Founding AI Engineer at an early-stage startup building the engineering intelligence layer for the AI era. up to ₹70 LPA, Remote (India), 3+ yrs, plus meaningful equity. | Priya Saraogi

Founding roles change the shape of your day. You own the AI architecture with PyTorch and LLM tooling.`);
    assert.equal(c.title, 'Founding AI Engineer');
    assert.equal(c.company, 'Not available', 'vague "startup" is not a company name');
    assert.equal(c.workMode, 'Remote');
    assert.equal(c.location, 'Remote (India)');
    assert.equal(c.experience, 'Senior');
    assert.match(c.salary, /₹70 LPA/);
    assert.ok(c.skills.includes('PyTorch') && c.skills.includes('LLM'));

    const d = extractJobFromText('React Developer Intern at Acme Labs, Bengaluru (hybrid). Stipend: ₹15K/month. 6-month internship.');
    assert.equal(d.type, 'Internship');
    assert.equal(d.workMode, 'Hybrid');
    assert.equal(d.location, 'Bengaluru');
    assert.equal(d.company, 'Acme Labs');
    assert.equal(d.salary, '₹15K/month');
});

test('LinkedIn post text + link: poster from the URL, emails and company page from the text', () => {
    const e = extractJobFromText(`We are hiring a Backend Engineer at Acme Labs! 2 yrs, Node.js, Pune.
Send your CV to hiring_team@acme-labs.io or Jobs@Acme-Labs.io
Company page: https://www.linkedin.com/company/acme-labs/
https://www.linkedin.com/posts/rahul-sharma-1a2b3c_hiring-backend-activity-7251234567890123456-AbCd?utm_source=share`);
    assert.equal(e.sourceUrl, 'https://www.linkedin.com/posts/rahul-sharma-1a2b3c_hiring-backend-activity-7251234567890123456-AbCd', 'query stripped, underscore kept');
    assert.deepEqual(e.poster, { name: 'Rahul Sharma', profileUrl: 'https://www.linkedin.com/in/rahul-sharma-1a2b3c' });
    assert.equal(e.companyLinkedin, 'https://www.linkedin.com/company/acme-labs');
    assert.deepEqual(e.contactEmails, ['hiring_team@acme-labs.io', 'jobs@acme-labs.io']);
    assert.equal(e.applyUrl, 'mailto:hiring_team@acme-labs.io', 'no real apply link → first email, not the LinkedIn post');

    const f = extractJobFromText('Hiring interns, DM me. https://in.linkedin.com/feed/update/urn:li:activity:7251234567890123456/');
    assert.equal(f.sourceUrl, 'https://www.linkedin.com/feed/update/urn:li:activity:7251234567890123456');
    assert.equal(f.poster.profileUrl, '', 'feed links carry no handle');
    assert.equal(f.applyUrl, f.sourceUrl, 'nothing else to apply with → the post itself');

    assert.equal(linkedinPost('https://www.linkedin.com/in/someone/'), null, 'a profile is not a post');
    assert.equal(linkedinPost('https://evil.com/posts/x_y'), null);
});

test('reach-out kit is members-only; guests and crawlers never see emails', () => {
    const base = {
        ...validJob, _id: 'j1', slug: 'backend-acme', skills: [], status: 'open', postedBy: 'u1', createdAt: '2026-09-01T00:00:00Z',
        description: `${validJob.description} Mail cv@acme.io today.`, applyUrl: 'mailto:cv@acme.io', contactEmails: ['cv@acme.io'],
        poster: { name: 'Rahul Sharma', profileUrl: 'https://www.linkedin.com/in/rahul' }, companyLinkedin: 'https://www.linkedin.com/company/acme-labs',
    };
    const guest = toPublicJob(base);
    assert.equal(guest.reachOut, null);
    assert.equal(guest.reachOutCount, 5, 'poster + 1 email + 3 people searches');
    assert.doesNotMatch(JSON.stringify(guest), /cv@acme\.io/);

    const member = toPublicJob(base, { _id: 'u2' });
    assert.deepEqual(member.reachOut.map((r) => r.kind), ['poster', 'email', 'search', 'search', 'search']);
    assert.equal(member.reachOut[2].href, 'https://www.linkedin.com/company/acme-labs/people/?keywords=founder');
    assert.match(member.description, /cv@acme\.io/);
    assert.equal(reachOutFor({ ...base, companyLinkedin: '' })[2].href, 'https://www.linkedin.com/search/results/people/?keywords=founder%20Acme%20Labs');

    const html = renderJobPage('<html><head></head><body><div id="root"></div></body></html>', base);
    assert.doesNotMatch(html, /cv@acme\.io/, 'crawler HTML hides emails');
});

test('parseJobInput validates the reach-out fields and canonicalises the post link', () => {
    const ok = parseJobInput({ ...validJob, sourceUrl: 'https://www.linkedin.com/posts/a-b_x-activity-1-z?trk=1', contactEmails: 'A@B.co, ', poster: { name: 'A', profileUrl: 'https://www.linkedin.com/in/a-b' } });
    assert.equal(ok.error, undefined);
    assert.equal(ok.data.sourceUrl, 'https://www.linkedin.com/posts/a-b_x-activity-1-z');
    assert.deepEqual(ok.data.contactEmails, ['a@b.co']);
    assert.match(parseJobInput({ ...validJob, sourceUrl: 'https://acme.example/job' }).error, /LinkedIn post/);
    assert.match(parseJobInput({ ...validJob, contactEmails: ['not-an-email'] }).error, /not a valid email/);
    assert.match(parseJobInput({ ...validJob, poster: { profileUrl: 'https://evil.com/in/x' } }).error, /linkedin\.com\/in/);
    assert.match(parseJobInput({ ...validJob, companyLinkedin: 'javascript:alert(1)' }).error, /linkedin\.com\/company/);
});

test('job quest: each stage owes the steps before it, proof stages wait for an admin, rules exist', () => {
    assert.deepEqual(rulesUpTo('saved'), []);
    assert.deepEqual(rulesUpTo('reached'), ['reached_out']);
    assert.deepEqual(rulesUpTo('offer'), ['reached_out', 'got_reply', 'got_interview', 'got_offer']);
    assert.equal(needsProof('reached', ''), false);
    assert.equal(needsProof('replied', ''), true);
    assert.equal(needsProof('interview', 'interview'), false, 'already verified: moving back up needs no new proof');
    assert.equal(needsProof('offer', 'interview'), true);
    assert.equal(proofUrl(' https://drive.google.com/file/d/x '), 'https://drive.google.com/file/d/x');
    for (const bad of ['javascript:alert(1)', 'data:text/html,x', 'not a url', '', undefined]) assert.equal(proofUrl(bad), '', String(bad));
    for (const r of ['reached_out', 'early_bird', 'got_reply', 'got_interview', 'got_offer', 'job_suggested', 'insider_referral']) assert.ok(POINT_RULES[r], r);
    assert.ok(badgesFor({ offers: 1, referralsOffered: 1 }).some((b) => b.id === 'offer_club'));
});

test('jobs expire after the deadline day and read as closed', () => {
    const day = 86400000;
    const now = Date.now();
    assert.equal(isExpired({ deadline: null }), false);
    assert.equal(isExpired({ deadline: new Date(now - day / 2) }), false, 'deadline day still counts');
    assert.equal(isExpired({ deadline: new Date(now - 2 * day) }), true);
    const job = { _id: 'j1', slug: 's', postedBy: 'u1', status: 'open', description: 'x', deadline: new Date(now - 2 * day), insiders: [{ user: 'u3' }] };
    const pub = toPublicJob(job);
    assert.equal(pub.status, 'closed');
    assert.equal(pub.insidersCount, 1);
    assert.equal(pub.insiders, undefined, 'guests get a count, not who');
    assert.equal(openFilter(now).$and[0].$or[1].deadline.$gte.getTime(), now - day);
});

test('a LinkedIn company page is refused before fetching, so the sign-in wall never fills the form', async () => {
    await assert.rejects(extractJobFromUrl('https://www.linkedin.com/company/interface-ai/home/https://www.linkedin.com/company/interface-ai/home/'), /company or profile page/);
    await assert.rejects(extractJobFromUrl('https://www.linkedin.com/in/someone/'), /company or profile page/);
});

test('a LinkedIn post is dated from its activity id, not from the day it was imported', () => {
    const at = Date.UTC(2025, 10, 3, 10);
    const id = String(BigInt(at) << 22n);
    assert.equal(linkedinPostDate(`https://www.linkedin.com/posts/jane-doe_hiring-react-activity-${id}-AbCd`).getTime(), at);
    assert.equal(linkedinPostDate(`https://www.linkedin.com/feed/update/urn:li:activity:${id}`).getTime(), at);
    assert.equal(linkedinPostDate('https://example.com/jobs/1'), null);
    assert.equal(linkedinPostDate(`https://www.linkedin.com/posts/x_y-activity-${id}-AbCd`, at - 1), null, 'a future date is refused');
});
