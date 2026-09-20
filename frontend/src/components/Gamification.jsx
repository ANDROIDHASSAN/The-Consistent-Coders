/* eslint-disable react-refresh/only-export-components */
import { Link } from 'react-router-dom';

// The four arenas. Mirrors TRACKS / POINT_RULES in backend/modules/points/points.service.js.
export const ARENAS = [
    { id: 'learn', label: 'Learning', icon: '📚', color: '#7cc4ff', to: '/learn', cta: 'Tick off a checkpoint', earn: ['+1 per learning checkpoint', '+5 for finishing a whole path'] },
    { id: 'build', label: 'Building', icon: '🛠️', color: '#ffb86b', to: '/projects', cta: 'Ship a project', earn: ['+3 per project submitted', '+1 per upvote you receive', '+2 per mission (with PR link)'] },
    { id: 'hire', label: 'Hiring', icon: '📣', color: '#ccff00', to: '/jobs/new', cta: 'Post a job', earn: ['+1 per job posted', '+1 when your job gets its first applicant', '+1 per applicant you review'] },
    { id: 'apply', label: 'Applying', icon: '🎯', color: '#ff7ab6', to: '/jobs', cta: 'Apply to a job', earn: ['+1 per application', '+2 when you get shortlisted'] },
];
export const arenaById = Object.fromEntries(ARENAS.map((a) => [a.id, a]));

const ordinal = (n) => (n ? `#${n}` : '—');

/** One card per arena: level, progress to next level, all-time + weekly rank, and the rival to beat. */
export const ArenaCards = ({ arenas, standings, compact = false }) => (
    <div className={`arena-grid ${compact ? 'arena-grid--compact' : ''}`}>
        {ARENAS.map((a) => {
            const s = arenas?.[a.id] ?? { points: 0, level: 1, progress: 0, next: 3 };
            const st = standings?.[a.id];
            const rival = st?.week?.rival ?? st?.all?.rival;
            return (
                <article key={a.id} className="arena-card" style={{ '--arena': a.color }}>
                    <header>
                        <span className="arena-icon" aria-hidden="true">{a.icon}</span>
                        <div>
                            <h3>{a.label}</h3>
                            <p className="mono-text">LV {s.level} · {s.points} PTS</p>
                        </div>
                    </header>
                    <div className="arena-bar" role="progressbar" aria-valuenow={s.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${a.label} level progress`}>
                        <i style={{ width: `${s.progress}%` }} />
                    </div>
                    <p className="arena-next">{s.next === null ? 'Max level reached' : `${s.next - s.points} pts to level ${s.level + 1}`}</p>
                    {standings && (
                        <dl className="arena-ranks">
                            <div><dt>All-time</dt><dd>{ordinal(st?.all?.position)}</dd></div>
                            <div><dt>This week</dt><dd>{ordinal(st?.week?.position)}</dd></div>
                        </dl>
                    )}
                    {!compact && (
                        rival
                            ? <p className="arena-rival">⚔️ <b>{rival.gap}</b> pt{rival.gap === 1 ? '' : 's'} to overtake <Link to={`/members/${rival.id}`}>{rival.name}</Link></p>
                            : s.points > 0 ? <p className="arena-rival">👑 You lead this arena</p> : <p className="arena-rival">Nobody's claimed this arena yet</p>
                    )}
                    {!compact && <Link to={a.to} className="btn-ghost btn-sm arena-cta">{a.cta} →</Link>}
                </article>
            );
        })}
    </div>
);

/** GitHub-style activity grid: points per day over the last 12 weeks. */
export const Heatmap = ({ activity = {}, weeks = 12 }) => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - (weeks * 7 - 1) - today.getDay());
    const days = [];
    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().slice(0, 10);
        days.push({ key, pts: activity[key] ?? 0 });
    }
    const total = days.reduce((n, d) => n + d.pts, 0);
    const active = days.filter((d) => d.pts > 0).length;
    const lvl = (p) => (p === 0 ? 0 : p < 2 ? 1 : p < 4 ? 2 : p < 7 ? 3 : 4);
    return (
        <figure className="heatmap">
            <div className="heatmap-grid" role="img" aria-label={`${total} points over ${active} active days in the last ${weeks} weeks`}>
                {days.map((d) => <i key={d.key} className={`hm-${lvl(d.pts)}`} title={`${d.key}: ${d.pts} pts`} />)}
            </div>
            <figcaption className="mono-text">{total} PTS · {active} ACTIVE DAYS · LAST {weeks} WEEKS <span className="hm-legend">LESS <i className="hm-0" /><i className="hm-1" /><i className="hm-2" /><i className="hm-3" /><i className="hm-4" /> MORE</span></figcaption>
        </figure>
    );
};

/** Every badge on the platform; earned ones lit, the rest locked so there's always a next goal. */
export const BadgeCabinet = ({ all = [], earned = [] }) => {
    const have = new Set(earned.map((b) => b.id));
    return (
        <div className="cabinet">
            {all.map((b) => (
                <span key={b.id} className={`cabinet-badge ${have.has(b.id) ? 'is-earned' : ''}`} title={have.has(b.id) ? `Earned: ${b.label}` : `Locked: ${b.label}`}>
                    <span aria-hidden="true">{have.has(b.id) ? b.icon : '🔒'}</span>{b.label}
                </span>
            ))}
        </div>
    );
};
