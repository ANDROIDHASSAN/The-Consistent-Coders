import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SignInButton } from '@clerk/react';
import { Seo } from '../seo/Seo';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Cta } from '../components/Cta';
import { Footer } from '../components/Footer';
import { useApi } from '../lib/api';
import { CLERK_ENABLED, useSession } from '../lib/auth';
import { useGame } from '../context/GameContext';

const EMPTY = { title: '', description: '', repoUrl: '', liveUrl: '', stack: '' };
const safe = (u) => (/^https:\/\//i.test(u || '') ? u : null);

export const ProjectsPage = () => {
    const api = useApi();
    const { isSignedIn, isLoaded } = useSession();
    const { celebrate, toast, play, me } = useGame();
    const [sort, setSort] = useState('top');
    const [projects, setProjects] = useState(null);
    const [error, setError] = useState('');
    const [form, setForm] = useState(EMPTY);
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        try {
            const res = await api(`/projects?sort=${sort}`);
            setProjects(res.projects);
            setError('');
        }
        catch (err) {
            setError(err.message);
            setProjects([]);
        }
    }, [api, sort]);

    useEffect(() => {
        if (isLoaded) load();
    }, [isLoaded, load]);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const res = await api('/projects', { method: 'POST', body: form });
            await celebrate(res.reward, 'project shipped');
            setForm(EMPTY);
            setOpen(false);
            setSort('new');
            await load();
        }
        catch (err) {
            toast(err.message, { kind: 'error', sound: 'error' });
        }
        finally {
            setBusy(false);
        }
    };

    const upvote = async (p) => {
        if (!isSignedIn) { toast('Sign in to upvote projects.', { kind: 'info' }); return; }
        setProjects((list) => list.map((x) => (x.id === p.id ? { ...x, hasVoted: true, upvotes: x.upvotes + 1 } : x)));
        try {
            await api(`/projects/${p.id}/upvote`, { method: 'POST' });
            play('points');
        }
        catch (err) {
            setProjects((list) => list.map((x) => (x.id === p.id ? { ...x, hasVoted: false, upvotes: x.upvotes - 1 } : x)));
            toast(err.message, { kind: 'error', sound: 'error' });
        }
    };

    const remove = async (p) => {
        if (!window.confirm(`Delete "${p.title}"? Points already earned stay.`)) return;
        try {
            await api(`/projects/${p.id}`, { method: 'DELETE' });
            setProjects((list) => list.filter((x) => x.id !== p.id));
        }
        catch (err) {
            toast(err.message, { kind: 'error', sound: 'error' });
        }
    };

    const crumbs = [{ name: 'Projects', path: '/projects' }];
    const build = me?.user?.arenas?.build;

    return (
        <>
            <Seo
                title="Student Developer Projects — Showcase, Upvote, Compete"
                description="Portfolio projects built by students and early-career developers in India. Ship yours, collect upvotes and climb the Building leaderboard on The Consistent Coders."
                path="/projects"
                jsonLd={Breadcrumbs.schema(crumbs)}
            />
            <div className="page">
                <div className="container">
                    <Breadcrumbs items={crumbs} />
                    <header className="page-head">
                        <p className="page-eyebrow mono-text">// 🛠️ BUILDING ARENA</p>
                        <h1 className="page-title">Projects that <em>prove</em> you can build</h1>
                        <p className="page-lede">Ship a project for <b>+3</b>, earn <b>+1</b> for every upvote it gets, and finish <Link to="/tasks">missions</Link> for <b>+2</b> each. The most-upvoted builders top the <Link to="/leaderboard?arena=build">Building leaderboard</Link>.</p>
                        {build && <p className="mono-text arena-inline">YOUR BUILDING: LV {build.level} · {build.points} PTS · {build.next === null ? 'MAX' : `${build.next - build.points} TO LV ${build.level + 1}`}</p>}
                    </header>

                    <div className="filter-summary mono-text">
                        <div className="view-toggle" role="group" aria-label="Sort">
                            <button type="button" aria-pressed={sort === 'top'} onClick={() => { play('click'); setSort('top'); }}>🔥 TOP</button>
                            <button type="button" aria-pressed={sort === 'new'} onClick={() => { play('click'); setSort('new'); }}>✨ NEW</button>
                        </div>
                        {CLERK_ENABLED && (isSignedIn
                            ? <button type="button" className="btn-primary" onClick={() => { play('click'); setOpen((o) => !o); }}><span className="btn-text">{open ? 'CLOSE' : '+ SHIP A PROJECT (+3)'}</span><div className="btn-bg"></div></button>
                            : <SignInButton mode="modal"><button type="button" className="btn-primary"><span className="btn-text">SIGN IN TO SHIP A PROJECT</span><div className="btn-bg"></div></button></SignInButton>)}
                    </div>

                    {open && (
                        <form className="panel project-form" onSubmit={submit}>
                            <div className="form-grid">
                                <label className="field"><span>Project name *</span><input required minLength={3} maxLength={100} placeholder="Job board with applicant tracking" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></label>
                                <label className="field"><span>Tech stack</span><input placeholder="React, Node.js, MongoDB" value={form.stack} onChange={(e) => setForm((f) => ({ ...f, stack: e.target.value }))} /></label>
                            </div>
                            <label className="field"><span>What it does + the hardest part * (40+ chars)</span><textarea required minLength={40} maxLength={1500} rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></label>
                            <div className="form-grid">
                                <label className="field"><span>GitHub repo</span><input type="url" placeholder="https://github.com/you/project" value={form.repoUrl} onChange={(e) => setForm((f) => ({ ...f, repoUrl: e.target.value }))} /></label>
                                <label className="field"><span>Live link</span><input type="url" placeholder="https://project.vercel.app" value={form.liveUrl} onChange={(e) => setForm((f) => ({ ...f, liveUrl: e.target.value }))} /></label>
                            </div>
                            <button type="submit" className="btn-primary" disabled={busy}><span className="btn-text">{busy ? 'SHIPPING…' : 'SHIP IT (+3 PTS)'}</span><div className="btn-bg"></div></button>
                        </form>
                    )}

                    {error && <p className="form-error" role="alert">{error}</p>}
                    {projects === null ? (
                        <div className="job-grid">{[0, 1, 2].map((i) => <div key={i} className="skeleton" />)}</div>
                    ) : projects.length === 0 ? (
                        <div className="empty"><p>No projects yet. Ship the first one and take #1 in the Building arena.</p></div>
                    ) : (
                        <div className="project-grid">
                            {projects.map((p, i) => (
                                <article key={p.id} className="project-card">
                                    {sort === 'top' && i < 3 && p.upvotes > 0 && <span className="project-medal" aria-label={`Rank ${i + 1}`}>{['🥇', '🥈', '🥉'][i]}</span>}
                                    <h2>{p.title}</h2>
                                    <p className="project-by mono-text">BY <Link to={`/members/${p.owner.id}`}>{p.owner.name ?? 'member'}</Link></p>
                                    <p className="project-desc">{p.description}</p>
                                    {p.stack.length > 0 && <div className="pill-row">{p.stack.map((s) => <span key={s} className="pill">{s}</span>)}</div>}
                                    <footer>
                                        <div className="project-links">
                                            {safe(p.liveUrl) && <a href={p.liveUrl} target="_blank" rel="noopener noreferrer nofollow">Live ↗</a>}
                                            {safe(p.repoUrl) && <a href={p.repoUrl} target="_blank" rel="noopener noreferrer nofollow">Code ↗</a>}
                                            {p.isOwner && <button type="button" className="link-btn" onClick={() => remove(p)}>Delete</button>}
                                        </div>
                                        <button type="button" className={`upvote ${p.hasVoted ? 'is-on' : ''}`} disabled={p.isOwner || p.hasVoted}
                                            aria-pressed={p.hasVoted} aria-label={`Upvote ${p.title}`} title={p.isOwner ? "You can't upvote your own project" : p.hasVoted ? 'Upvoted' : 'Upvote (+1 to the builder)'} onClick={() => upvote(p)}>
                                            ▲ <b>{p.upvotes}</b>
                                        </button>
                                    </footer>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
                <Cta title="Built something? Put it where hiring managers look." text="Projects show up on your public profile and next to every application you send." primary={{ to: '/tasks', label: 'OPEN MISSIONS (+2 EACH) →' }} secondary={{ to: '/leaderboard?arena=build', label: 'BUILDING LEADERBOARD' }} />
            </div>
            <Footer />
        </>
    );
};
