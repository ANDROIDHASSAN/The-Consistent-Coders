import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Seo } from '../seo/Seo';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Cta } from '../components/Cta';
import { Footer } from '../components/Footer';
import { ARENAS, arenaById } from '../components/Gamification';
import { apiFetch } from '../lib/api';
import { useGame } from '../context/GameContext';

const TABS = [{ id: 'all', label: 'Overall', icon: '🏆' }, ...ARENAS];

const Avatar = ({ user, small }) => (
    <span className={`avatar ${small ? 'avatar--sm' : ''}`}>
        {user.picture ? <img src={user.picture} alt="" loading="lazy" /> : (user.name?.[0] ?? '?').toUpperCase()}
    </span>
);

export const LeaderboardPage = () => {
    const { me, play } = useGame();
    const [params, setParams] = useSearchParams();
    const track = TABS.some((t) => t.id === params.get('arena')) ? params.get('arena') : 'all';
    const period = params.get('period') === 'week' ? 'week' : 'all';
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let alive = true;
        apiFetch(`/points/leaderboard?limit=100&track=${track}&period=${period}`)
            .then((res) => { if (alive) { setData(res); setError(''); } })
            .catch((err) => { if (alive) setError(err.message); });
        return () => { alive = false; };
    }, [track, period]);

    const pick = (key, value) => {
        play('click');
        const next = new URLSearchParams(params);
        if (value === 'all') next.delete(key); else next.set(key, value);
        setParams(next, { replace: true });
    };

    const leaders = data && data.track === track && data.period === period ? data.leaders : null;
    const top3 = leaders?.slice(0, 3) ?? [];
    const rest = leaders?.slice(3) ?? [];
    const mine = me?.standings?.[track]?.[period];
    const tab = TABS.find((t) => t.id === track);
    const crumbs = [{ name: 'Leaderboard', path: '/leaderboard' }];

    return (
        <>
            <Seo
                title="Leaderboards — Learning, Building, Hiring and Applying"
                description="Four competitive arenas on The Consistent Coders: learning paths, projects and missions, job posting, and job applications. All-time and weekly leaderboards, levels and badges."
                path="/leaderboard"
                jsonLd={Breadcrumbs.schema(crumbs)}
            />
            <div className="page">
                <div className="container">
                    <Breadcrumbs items={crumbs} />
                    <header className="page-head">
                        <p className="page-eyebrow mono-text">// LEADERBOARDS</p>
                        <h1 className="page-title">Four arenas. <em>One question:</em> who's most consistent?</h1>
                        <p className="page-lede">Every checkpoint, project, job post and application is a point in its arena. Weekly boards reset every 7 days — so anyone can top them.</p>
                    </header>

                    <div className="lb-controls">
                        <div className="lb-tabs" role="tablist" aria-label="Arena">
                            {TABS.map((t) => (
                                <button key={t.id} type="button" role="tab" aria-selected={track === t.id} className={track === t.id ? 'is-on' : ''}
                                    style={t.color ? { '--arena': t.color } : undefined} onClick={() => pick('arena', t.id)}>
                                    <span aria-hidden="true">{t.icon}</span> {t.label}
                                </button>
                            ))}
                        </div>
                        <div className="view-toggle" role="group" aria-label="Period">
                            <button type="button" aria-pressed={period === 'all'} onClick={() => pick('period', 'all')}>ALL-TIME</button>
                            <button type="button" aria-pressed={period === 'week'} onClick={() => pick('period', 'week')}>THIS WEEK</button>
                        </div>
                    </div>

                    {me?.user && (
                        <div className="lb-me-bar" style={tab.color ? { '--arena': tab.color } : undefined}>
                            <span>You: <b>{mine?.position ? `#${mine.position}` : 'unranked'}</b> in {tab.label} {period === 'week' ? 'this week' : 'all-time'} · <b>{mine?.score ?? 0}</b> pts</span>
                            {mine?.rival
                                ? <span>⚔️ {mine.rival.gap} pt{mine.rival.gap === 1 ? '' : 's'} to overtake <Link to={`/members/${mine.rival.id}`}>{mine.rival.name}</Link></span>
                                : mine?.position === 1 ? <span>👑 You're on top — defend it</span> : null}
                            {track !== 'all' && <Link to={arenaById[track].to} className="btn-ghost btn-sm">{arenaById[track].cta} →</Link>}
                        </div>
                    )}

                    {error && <p className="form-error" role="alert">{error}</p>}

                    {error ? null : !leaders ? (
                        <div className="podium">{[0, 1, 2].map((i) => <div key={i} className="skeleton" />)}</div>
                    ) : leaders.length === 0 ? (
                        <div className="empty">
                            <p>Nobody has scored in {tab.label}{period === 'week' ? ' this week' : ''} yet. The #1 spot is open.</p>
                            <p style={{ marginTop: '1rem' }}><Link to={track === 'all' ? '/jobs' : arenaById[track].to} className="btn-ghost">{track === 'all' ? 'Earn your first point' : arenaById[track].cta} →</Link></p>
                        </div>
                    ) : (
                        <>
                            <section className="podium" aria-label="Top three">
                                {top3.map((u) => (
                                    <Link key={u.id} to={`/members/${u.id}`} className={`podium-card podium-card--${u.rank} ${u.id === me?.user?.id ? 'lb-me' : ''}`}>
                                        <span className="podium-rank">#{u.rank}</span>
                                        <Avatar user={u} />
                                        <div className="podium-name">{u.name}</div>
                                        <div className="podium-points">{u.score} pts</div>
                                        <div className="podium-title">{u.title}</div>
                                        {u.badges?.length > 0 && <div className="badge-row" style={{ justifyContent: 'center', marginTop: '0.75rem' }}>{u.badges.slice(0, 4).map((b) => <span key={b.id} className="badge-chip" title={b.label}>{b.icon}</span>)}</div>}
                                    </Link>
                                ))}
                            </section>

                            {rest.length > 0 && (
                                <div className="table-wrap">
                                    <table className="table">
                                        <caption>{tab.label} · {period === 'week' ? 'last 7 days' : 'all-time'} · top {leaders.length}</caption>
                                        <thead>
                                            <tr>
                                                <th className="num">#</th><th>Member</th><th>Rank</th>
                                                {ARENAS.map((a) => <th key={a.id} className="num" title={`${a.label} (all-time)`}>{a.icon}</th>)}
                                                <th className="num">Streak</th><th className="num">{period === 'week' ? 'Week pts' : 'Points'}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rest.map((u) => (
                                                <tr key={u.id} className={u.id === me?.user?.id ? 'lb-me' : ''}>
                                                    <td className="num">{u.rank}</td>
                                                    <td><Link to={`/members/${u.id}`} className="lb-user"><Avatar user={u} small /><div><div>{u.name}</div>{u.headline && <small style={{ color: 'var(--muted)' }}>{u.headline}</small>}</div></Link></td>
                                                    <td><span className="pill pill--muted">{u.title}</span></td>
                                                    {ARENAS.map((a) => <td key={a.id} className="num">{u.trackPoints[a.id]}</td>)}
                                                    <td className="num">{u.streak}🔥</td>
                                                    <td className="num" style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{u.score}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}

                    <section className="section-gap" aria-labelledby="rules-title">
                        <h2 id="rules-title" className="h2">How to score in each arena</h2>
                        <div className="arena-rules">
                            {ARENAS.map((a) => (
                                <div key={a.id} className="arena-rule" style={{ '--arena': a.color }}>
                                    <h3><span aria-hidden="true">{a.icon}</span> {a.label}</h3>
                                    <ul>{a.earn.map((e) => <li key={e}>{e}</li>)}</ul>
                                    <Link to={a.to}>{a.cta} →</Link>
                                </div>
                            ))}
                        </div>
                        <p className="page-lede" style={{ marginTop: '1rem' }}>Plus +1 for your daily check-in and +1 for adding a profile headline. Each arena has 10 levels; total points set your overall rank.</p>
                        <h2 className="h2" style={{ marginTop: '2.5rem' }}>Overall ranks</h2>
                        <div className="onb-ranks">
                            {(data?.ranks ?? []).map((r) => <div key={r.name} className="onb-rank"><b>{r.name}</b><span>{r.min}+ pts</span></div>)}
                        </div>
                        <h2 className="h2" style={{ marginTop: '2.5rem' }}>Badges to unlock</h2>
                        <div className="cabinet">
                            {(data?.badges ?? []).map((b) => <span key={b.id} className="cabinet-badge is-earned"><span aria-hidden="true">{b.icon}</span>{b.label}</span>)}
                        </div>
                    </section>
                </div>
                <Cta title="Pick an arena. Climb it." text="Learn a path, ship a project, post a job or apply to one — every action puts you on a board." />
            </div>
            <Footer />
        </>
    );
};
