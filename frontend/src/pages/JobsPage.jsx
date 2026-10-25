import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Seo, faqSchema } from '../seo/Seo';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Cta } from '../components/Cta';
import { Footer } from '../components/Footer';
import { apiFetch } from '../lib/api';
import { useGame } from '../context/GameContext';
import { heatOf, skillMatch } from '../lib/jobs';
import { AdminQueue, SuggestJob, WinsWall } from '../components/JobsBoard';
import { CITIES, JOB_CATEGORIES, categoryBySlug, cityBySlug, companyPage, listPageTitle, slugify } from '../content/jobCategories';

const TYPES = ['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance'];
const MODES = ['Remote', 'Hybrid', 'On-site'];
const LEVELS = ['Fresher', 'Junior', 'Mid', 'Senior'];
const POSTED = [['1', 'Past 24 hours'], ['3', 'Past 3 days'], ['7', 'Past week'], ['14', 'Past 2 weeks']];
// One-tap shortcuts for what freshers filter by most.
const QUICK = [['type', 'Internship', '🎓 Internships'], ['workMode', 'Remote', '🏠 Remote'], ['experience', 'Fresher', '🌱 Fresher'], ['posted', '1', '⚡ Last 24h'], ['paid', '1', '💰 Salary shown']];
const FILTER_KEYS = ['q', 'skills', 'type', 'workMode', 'experience', 'posted', 'location', 'paid', 'sort'];
const PAGE_SIZE = 30;

const FAQS = [
    { q: 'Who posts the jobs here?', a: 'Our admins post and check every listing, so there are no fake or stale roles. Members suggest jobs they find on LinkedIn or WhatsApp, and earn 2 points when a suggestion goes live. Listings expire after 21 days unless they have their own deadline.' },
    { q: 'What is a Job Quest?', a: 'Your own tracker for every job you chase. Mark it Saved, then Reached out (+1, or +2 extra if you reach out within 24 hours of the job going live), Got a reply (+3), Interview (+10) and Offer (+50). Replies, interviews and offers need a proof link (a screenshot of the email, invite or offer letter); the points land once an admin checks it. Verified interviews and offers show up on the Wall of Wins.' },
    { q: 'Who can see contacts and apply?', a: 'Anyone with a free account. Members see the poster, emails from the post, founder and recruiter search links, and insiders at the company who offered to refer. Applying earns 1 point.' },
    { q: 'What is an insider?', a: 'A member who works at the hiring company and offers referrals. Set your company on your profile, then tap "Offer referrals" on that company\'s job for 2 points.' },
    { q: 'What kinds of jobs are listed?', a: 'Developer jobs and internships for freshers and early-career engineers in India and remote: frontend, backend, full-stack, mobile, data, DevOps, design and more.' },
];

const daysAgo = (date) => {
    const d = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
    return d <= 0 ? 'today' : d === 1 ? '1 day ago' : `${d} days ago`;
};

export const JobsPage = () => {
    const [params, setParams] = useSearchParams();
    const route = useParams();
    const cat = categoryBySlug(route.category);
    const place = cityBySlug(route.city);
    const { play, me } = useGame();
    const mySkills = me?.user?.skills ?? [];
    const [data, setData] = useState({ items: [], total: 0, pages: 1, page: 1, categories: {} });
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const [view, setView] = useState(() => {
        try { return (typeof window !== 'undefined' && localStorage.getItem('tcc_jobs_view')) || 'cards'; } catch { return 'cards'; }
    });

    const filters = useMemo(() => ({
        ...Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) || ''])),
        category: cat?.slug || '',
        location: params.get('location') || place?.name || '',
        company: route.company || '',
        skill: route.skill || '',
    }), [params, cat, place, route.company, route.skill]);
    const query = (page) => new URLSearchParams([...Object.entries(filters).filter(([, v]) => v), ['limit', String(PAGE_SIZE)], ...(page > 1 ? [['page', String(page)]] : [])]);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError('');
        apiFetch(`/jobs?${query(1)}`)
            .then((res) => { if (alive) setData(res); })
            .catch((err) => { if (alive) setError(err.message); })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- query() only reads filters
    }, [filters]);

    // Appends the next page under the current one: no pager to aim at, no jump back to the top.
    const loadMore = () => {
        setLoadingMore(true);
        apiFetch(`/jobs?${query(data.page + 1)}`)
            .then((res) => setData((d) => ({ ...res, items: [...d.items, ...res.items] })))
            .catch((err) => setError(err.message))
            .finally(() => setLoadingMore(false));
    };

    const setFilter = (key, value) => {
        const next = new URLSearchParams(params);
        if (value) next.set(key, value); else next.delete(key);
        setParams(next, { replace: true });
    };
    const keepQuery = params.toString() ? `?${params}` : '';

    const switchView = (v) => {
        setView(v);
        play('click');
        try { localStorage.setItem('tcc_jobs_view', v); } catch { /* ignore */ }
    };

    const titleBits = [filters.workMode, filters.experience, filters.type].filter(Boolean).join(' ');
    const roleName = cat ? `${cat.name} Developer` : 'Developer';
    const isFiltered = FILTER_KEYS.some((k) => params.get(k));
    // Programmatic pages: one per company and per city, each with its own title, h1 and canonical.
    const companyName = route.company ? (data.company || route.company.replace(/-/g, ' ')) : '';
    const where = place ? (place.slug === 'remote' ? 'remote' : `in ${place.name}`) : '';
    const company = companyName ? companyPage(companyName, data.items) : null;
    const skillName = route.skill ? (data.skill || route.skill.replace(/-/g, ' ')) : '';
    const page = skillName
        ? { path: `/jobs/skill/${route.skill}`, crumb: skillName, title: listPageTitle({ skill: skillName }), h1: <>{skillName} jobs <em>&amp; internships</em></>, lede: `Every open role that asks for ${skillName}, checked by admins. Fresher-friendly and free to apply.` }
        : companyName
        ? { path: `/jobs/company/${route.company}`, crumb: companyName, title: listPageTitle({ company: companyName }), h1: <>{companyName} careers: <em>jobs &amp; internships</em></>, lede: `Every open role at ${companyName}, checked by admins. Reach the people hiring and get referred by insiders.` }
        : place
            ? { path: `/jobs/in/${place.slug}`, crumb: place.name, title: listPageTitle({ city: place }), h1: <>Developer jobs &amp; internships <em>{where}</em></>, lede: `Fresher-friendly developer roles ${where}, every one checked by admins.` }
            : cat
                ? { path: `/jobs/category/${cat.slug}`, crumb: cat.name, title: `${titleBits ? `${titleBits} ` : ''}${roleName} Jobs & Internships for Freshers`, h1: <>{cat.icon} {roleName} jobs &amp; internships <em>for freshers</em></>, lede: `${cat.intro} Every role is checked by admins.` }
                : null;
    const seoTitle = page?.title ?? (titleBits ? `${titleBits} Developer Jobs & Internships for Freshers` : 'Developer Jobs & Internships for Freshers in India');
    const path = page?.path ?? '/jobs';
    const crumbs = [{ name: 'Jobs', path: '/jobs' }, ...(page ? [{ name: page.crumb, path }] : [])];
    const allCount = Object.values(data.categories ?? {}).reduce((a, b) => a + b, 0);

    return (
        <>
            <Seo
                title={seoTitle}
                description={company && data.total
                    ? company.description
                    : page && !cat
                    ? `${page.lede} Free to apply on The Consistent Coders.`
                    : cat
                    ? `${cat.intro} Free ${cat.name.toLowerCase()} jobs and internships in India and remote, every role checked by admins. Track each hunt as a quest and get referred by insiders.`
                    : 'Browse free developer jobs and internships for students and freshers in India — remote, hybrid and on-site. Every role checked by admins. Track your job hunt as a quest, get referred by insiders and earn points on the community leaderboard.'}
                path={path}
                // Same rule as the crawler HTML: a company, city or skill page needs 2+ open jobs to be indexed.
                noindex={isFiltered || ((companyName || place || skillName) && !loading && data.total < 2)}
                jsonLd={[Breadcrumbs.schema(crumbs), ...(page ? [] : [faqSchema(FAQS)])]}
            />
            <div className="page">
                <div className="container">
                    <Breadcrumbs items={crumbs} />
                    <header className="page-head">
                        <p className="page-eyebrow mono-text">// JOB DIRECTORY{page ? ` · ${page.crumb.toUpperCase()}` : ''}</p>
                        {page ? (
                            <>
                                <h1 className="page-title">{page.h1}</h1>
                                <p className="page-lede">{page.lede}</p>
                            </>
                        ) : (
                            <>
                                <h1 className="page-title">Developer jobs &amp; internships, <em>posted by the community</em></h1>
                                <p className="page-lede">
                                    Every role is checked by admins. Track each one as a quest, reach the people hiring, get referred by insiders, and climb the <Link to="/leaderboard">leaderboard</Link>.
                                </p>
                            </>
                        )}
                    </header>

                    {me?.isAdmin && <AdminQueue />}

                    {/* Crawlable links to every category page, and one tap to switch. Keeps the search/filters. */}
                    <nav className="cat-row" aria-label="Job categories">
                        <Link to={`/jobs${keepQuery}`} className="cat-chip" aria-current={cat ? undefined : 'page'}>All{allCount ? <b>{allCount}</b> : null}</Link>
                        {JOB_CATEGORIES.map((c) => (
                            <Link key={c.slug} to={`/jobs/category/${c.slug}${keepQuery}`} className="cat-chip" aria-current={cat?.slug === c.slug ? 'page' : undefined}>
                                {c.icon} {c.name}{data.categories?.[c.slug] ? <b>{data.categories[c.slug]}</b> : null}
                            </Link>
                        ))}
                    </nav>

                    <div className="quick-row" role="group" aria-label="Quick filters">
                        {QUICK.map(([key, value, label]) => (
                            <button key={key} type="button" className="cat-chip" aria-pressed={filters[key] === value} onClick={() => { play('click'); setFilter(key, filters[key] === value ? '' : value); }}>{label}</button>
                        ))}
                        {mySkills.length > 0 && (
                            <button type="button" className="cat-chip" aria-pressed={filters.skills === mySkills.join(',')} onClick={() => setFilter('skills', filters.skills === mySkills.join(',') ? '' : mySkills.join(','))}>🎯 For me</button>
                        )}
                        {isFiltered && <button type="button" className="cat-chip cat-chip--clear" onClick={() => setParams(new URLSearchParams(), { replace: true })}>✕ Clear filters</button>}
                    </div>

                    <form className="filters" role="search" onSubmit={(e) => e.preventDefault()}>
                        <label className="field">
                            <span>Search</span>
                            <input type="search" placeholder="Search title, company, skill or city…" value={filters.q} onChange={(e) => setFilter('q', e.target.value)} aria-label="Search jobs" />
                        </label>
                        <label className="field">
                            <span>Type</span>
                            <select value={filters.type} onChange={(e) => setFilter('type', e.target.value)} aria-label="Job type">
                                <option value="">All types</option>
                                {TYPES.map((t) => <option key={t}>{t}</option>)}
                            </select>
                        </label>
                        <label className="field">
                            <span>Work mode</span>
                            <select value={filters.workMode} onChange={(e) => setFilter('workMode', e.target.value)} aria-label="Work mode">
                                <option value="">Any mode</option>
                                {MODES.map((t) => <option key={t}>{t}</option>)}
                            </select>
                        </label>
                        <label className="field">
                            <span>Experience</span>
                            <select value={filters.experience} onChange={(e) => setFilter('experience', e.target.value)} aria-label="Experience level">
                                <option value="">Any level</option>
                                {LEVELS.map((t) => <option key={t}>{t}</option>)}
                            </select>
                        </label>
                        <label className="field">
                            <span>Date posted</span>
                            <select value={filters.posted} onChange={(e) => setFilter('posted', e.target.value)} aria-label="Date posted">
                                <option value="">Any time</option>
                                {POSTED.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                        </label>
                        <label className="field">
                            <span>Location</span>
                            <select value={filters.location} onChange={(e) => setFilter('location', e.target.value)} aria-label="Location">
                                <option value="">Any city</option>
                                {CITIES.map((c) => <option key={c.slug}>{c.name}</option>)}
                            </select>
                        </label>
                        <label className="field">
                            <span>Sort</span>
                            <select value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)} aria-label="Sort jobs">
                                <option value="">Newest first</option>
                                <option value="closing">Closing soon</option>
                            </select>
                        </label>
                    </form>

                    {filters.skills && (
                        <p className="match-chip mono-text">
                            MATCHING YOUR SKILLS: {filters.skills.split(',').join(' · ')}
                            <button type="button" aria-label="Clear skill filter" onClick={() => setFilter('skills', '')}>✕</button>
                        </p>
                    )}
                    <div className="filter-summary mono-text">
                        <span>{loading ? 'LOADING…' : `${data.total} OPEN ROLE${data.total === 1 ? '' : 'S'}`}</span>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <div className="view-toggle" role="group" aria-label="View">
                                <button type="button" aria-pressed={view === 'cards'} onClick={() => switchView('cards')}>CARDS</button>
                                <button type="button" aria-pressed={view === 'table'} onClick={() => switchView('table')}>TABLE</button>
                            </div>
                            {me?.isAdmin
                                ? <Link to="/jobs/new" className="btn-ghost btn-sm" onClick={() => play('click')}>+ POST A JOB</Link>
                                : <a href="#suggest" className="btn-ghost btn-sm">+ SUGGEST A JOB</a>}
                        </div>
                    </div>

                    {error && <p className="form-error" role="alert">{error}</p>}

                    {loading ? (
                        <div className="job-grid">{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton" />)}</div>
                    ) : data.items.length === 0 ? (
                        <div className="empty">
                            <p>No open roles match these filters yet.</p>
                            <p style={{ marginTop: '1rem' }}><a href="#suggest" className="btn-ghost">Found one? Suggest it (+2 pts)</a></p>
                        </div>
                    ) : view === 'table' ? (
                        <div className="table-wrap">
                            <table className="table">
                                <caption>{data.total} open developer roles · updated live</caption>
                                <thead>
                                    <tr><th>Role</th><th>Company</th><th>Type</th><th>Mode</th><th>Level</th><th>Location</th><th>Salary</th><th className="num">Posted</th></tr>
                                </thead>
                                <tbody>
                                    {data.items.map((job) => (
                                        <tr key={job.id}>
                                            <td><Link to={`/jobs/${job.slug}`}>{job.title}</Link></td>
                                            <td>{job.company === 'Not available' ? job.company : <Link to={`/jobs/company/${slugify(job.company)}`}>{job.company}</Link>}</td>
                                            <td>{job.type}</td>
                                            <td>{job.workMode}</td>
                                            <td>{job.experience}</td>
                                            <td>{job.location}</td>
                                            <td>{job.salary || '—'}</td>
                                            <td className="num">{daysAgo(job.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="job-grid">
                            {data.items.map((job) => {
                                const heat = heatOf(job);
                                const match = skillMatch(job.skills, mySkills);
                                return (
                                <Link key={job.id} to={`/jobs/${job.slug}`} className="job-item" onMouseEnter={() => play('hover')}>
                                    <div className="job-item-top">
                                        <span className="pill pill--accent">{job.type}</span>
                                        {heat ? <span className={`pill heat heat--${heat.label.split(' ')[0].toLowerCase()}`}>{heat.icon} {heat.label}</span> : <span className="pill pill--muted">{job.workMode}</span>}
                                    </div>
                                    {heat?.earlyBirdHours && <p className="quest-early mono-text">🐦 EARLY BIRD +2 · {heat.earlyBirdHours}H LEFT</p>}
                                    <h2 className="job-item-title">{job.title}</h2>
                                    <div className="job-item-company">{job.company} · {job.location}</div>
                                    <div className="job-item-meta">
                                        {heat && <span>{job.workMode}</span>}
                                        <span>{job.experience}</span>
                                        {job.salary && <span>{job.salary}</span>}
                                        {job.deadline && <span>Apply by {new Date(job.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                                    </div>
                                    {job.skills?.length > 0 && (
                                        <div className="pill-row">{job.skills.slice(0, 4).map((s) => <span key={s} className="pill">{s}</span>)}</div>
                                    )}
                                    <div className="job-item-signals mono-text">
                                        {match && <span className={match.hit ? 'is-hit' : ''}>🎯 {match.hit}/{match.total} SKILLS</span>}
                                        {job.huntersCount > 0 && <span>👥 {job.huntersCount} HUNTING</span>}
                                        {job.insidersCount > 0 && <span>🤝 {job.insidersCount} INSIDER{job.insidersCount === 1 ? '' : 'S'}</span>}
                                    </div>
                                    <div className="job-item-foot">
                                        <span>{daysAgo(job.createdAt)} · {job.applicantsCount} applicant{job.applicantsCount === 1 ? '' : 's'}</span>
                                        <strong>VIEW →</strong>
                                    </div>
                                </Link>
                                );
                            })}
                        </div>
                    )}

                    {!loading && data.page < data.pages && (
                        <div className="pager">
                            <button type="button" className="btn-ghost" disabled={loadingMore} onClick={() => { play('click'); loadMore(); }}>
                                {loadingMore ? 'LOADING…' : `SHOW ${Math.min(PAGE_SIZE, data.total - data.items.length)} MORE JOBS ↓`}
                            </button>
                        </div>
                    )}

                    {/* Crawlable links into every city page. */}
                    <nav className="cat-row section-gap" aria-label="Jobs by city">
                        {CITIES.map((c) => (
                            <Link key={c.slug} to={`/jobs/in/${c.slug}`} className="cat-chip" aria-current={place?.slug === c.slug ? 'page' : undefined}>
                                {c.slug === 'remote' ? '🏠 Remote jobs' : `📍 Jobs in ${c.name}`}
                            </Link>
                        ))}
                    </nav>

                    <WinsWall />
                    {!me?.isAdmin && <SuggestJob />}

                    <section className="section-gap" aria-labelledby="faq-title">
                        <h2 id="faq-title" className="h2">{company && data.total ? `${companyName} hiring: FAQs` : 'Frequently asked questions'}</h2>
                        <div className="faq">
                            {(company && data.total ? company.faq : FAQS).map((f) => (
                                <details key={f.q}>
                                    <summary>{f.q}</summary>
                                    <p>{f.a}</p>
                                </details>
                            ))}
                        </div>
                    </section>
                </div>
                <Cta />
            </div>
            <Footer />
        </>
    );
};
