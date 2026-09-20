// Run: node --test backend/tests   (no database needed)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseJobInput } from '../modules/jobs/job.service.js';
import { extractJobFromText } from '../modules/jobs/job.extract.js';
import { rankFor, badgesFor, levelFor, arenasFor, POINT_RULES, TRACKS } from '../modules/points/points.service.js';
import { learningSummary, PATHS } from '../modules/learn/learn.routes.js';
import { buildSitemap, renderJobPage } from '../modules/seo/seo.service.js';
import { env } from '../config/env.js';

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
    description: 'Build the dashboard in React with a small team. You will ship weekly, review PRs and own one feature end to end.',
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
});

test('renderJobPage injects title, JobPosting JSON-LD and crawlable body; closed jobs get noindex', () => {
    const shell = '<html><head><title>x</title><meta name="description" content="old" /></head><body><div id="root"></div><script src="/a.js"></script></body></html>';
    const job = {
        ...validJob, slug: 'react-developer-intern-acme-labs', skills: ['React'], status: 'open',
        createdAt: '2026-09-01T00:00:00Z', deadline: null, companyUrl: '',
    };
    const html = renderJobPage(shell, job);
    assert.match(html, /<title>React Developer Intern at Acme Labs — Internship, Remote \(India\) \| The Consistent Coders<\/title>/);
    assert.equal((html.match(/<title>/g) || []).length, 1, 'old title stripped');
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
    assert.equal(c.company, '', 'vague "startup" is not a company name');
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
