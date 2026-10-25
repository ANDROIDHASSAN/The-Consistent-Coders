import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SignInButton } from '@clerk/react';
import { apiFetch, useApi } from '../lib/api';
import { CLERK_ENABLED, useSession } from '../lib/auth';
import { useGame } from '../context/GameContext';
import { QUEST_STEPS } from '../lib/jobs';

/** This week's interviews and verified offers from the community. Public, first names only. */
export const WinsWall = () => {
    const [wins, setWins] = useState(null);
    useEffect(() => {
        apiFetch('/jobs/wins').then(setWins).catch(() => setWins(null));
    }, []);
    if (!wins || (!wins.items.length && !wins.week.interviews)) return null;
    return (
        <section className="wins" aria-labelledby="wins-title">
            <h2 id="wins-title" className="wins-head mono-text">
                🏆 WALL OF WINS · {wins.week.interviews} INTERVIEW{wins.week.interviews === 1 ? '' : 'S'} · {wins.week.offers} OFFER{wins.week.offers === 1 ? '' : 'S'} THIS WEEK
            </h2>
            <ul className="wins-row">
                {wins.items.map((w) => (
                    <li key={w.id} className={`win win--${w.kind}`}>
                        <span aria-hidden="true">{w.kind === 'offer' ? '🏅' : '🎤'}</span>
                        <span><b>{w.name}</b> {w.kind === 'offer' ? 'got an offer at' : 'is interviewing at'} <Link to={`/jobs/${w.job.slug}`}>{w.job.company}</Link></span>
                    </li>
                ))}
            </ul>
        </section>
    );
};

/** Members hand in jobs they found; an admin lists them. */
export const SuggestJob = () => {
    const api = useApi();
    const { isSignedIn } = useSession();
    const { toast, play } = useGame();
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            await api('/jobs/suggestions', { method: 'POST', body: { text } });
            setText('');
            toast('Thanks! When an admin lists it you get +2 points.', { kind: 'success', sound: 'success' });
        }
        catch (err) {
            setError(err.message);
            play('error');
        }
        finally {
            setBusy(false);
        }
    };

    return (
        <section id="suggest" className="panel section-gap" aria-labelledby="suggest-title">
            <h3 id="suggest-title">Found a job? Suggest it · +2 pts when listed</h3>
            {isSignedIn ? (
                <form onSubmit={submit} style={{ display: 'grid', gap: '0.75rem' }}>
                    <label className="field">
                        <span>Paste the LinkedIn post text and its link, or a WhatsApp forward</span>
                        <textarea rows={4} maxLength={20000} value={text} onChange={(e) => setText(e.target.value)} placeholder="We're hiring a React intern… https://www.linkedin.com/posts/…" />
                    </label>
                    {error && <p className="form-error" role="alert">{error}</p>}
                    <button type="submit" className="btn-ghost btn-sm" disabled={busy || text.trim().length < 20}>{busy ? 'SENDING…' : 'SUGGEST JOB'}</button>
                </form>
            ) : CLERK_ENABLED && (
                <SignInButton mode="modal"><button type="button" className="btn-ghost btn-sm">SIGN IN TO SUGGEST</button></SignInButton>
            )}
        </section>
    );
};

/** Admins: suggestions to list, quest proofs (reply / interview / offer) to verify. */
export const AdminQueue = () => {
    const api = useApi();
    const { toast, play } = useGame();
    const [queue, setQueue] = useState(null);
    const load = useCallback(() => api('/jobs/admin/queue').then(setQueue).catch((err) => toast(err.message, { kind: 'error' })), [api, toast]);
    useEffect(() => { load(); }, [load]);

    const act = async (path, body) => {
        try {
            await api(path, { method: path.includes('/verify') ? 'POST' : 'PATCH', body });
            play('click');
            load();
        }
        catch (err) {
            toast(err.message, { kind: 'error', sound: 'error' });
        }
    };

    if (!queue || (!queue.suggestions.length && !queue.proofs.length)) return null;
    return (
        <section className="panel section-gap" aria-labelledby="queue-title">
            <h3 id="queue-title">Admin queue · {queue.suggestions.length} suggestion{queue.suggestions.length === 1 ? '' : 's'} · {queue.proofs.length} proof{queue.proofs.length === 1 ? '' : 's'}</h3>
            <ul className="queue-list">
                {queue.suggestions.map((s) => (
                    <li key={s.id}>
                        <p><b>{s.by}</b> suggested: {s.text.slice(0, 180)}{s.text.length > 180 ? '…' : ''}</p>
                        <div className="pill-row">
                            <Link to={`/jobs/new?suggestion=${s.id}`} className="btn-ghost btn-sm">POST IT</Link>
                            <button type="button" className="btn-ghost btn-sm" onClick={() => act(`/jobs/suggestions/${s.id}`, { status: 'rejected' })}>REJECT</button>
                        </div>
                    </li>
                ))}
                {queue.proofs.map((p) => {
                    const step = QUEST_STEPS.find((s) => s.id === p.stage);
                    return (
                        <li key={p.id}>
                            <p>{step.icon} <b>{p.member}</b> claims <b>{step.label}</b>: <Link to={`/jobs/${p.job.slug}`}>{p.job.title} at {p.job.company}</Link></p>
                            <p><a href={p.url} target="_blank" rel="noopener noreferrer nofollow">Open proof ↗</a>{p.note && <> · “{p.note}”</>}</p>
                            <div className="pill-row">
                                <button type="button" className="btn-ghost btn-sm" onClick={() => act(`/jobs/quests/${p.id}/verify`, { verified: true })}>VERIFY (+{step.pts})</button>
                                <button type="button" className="btn-ghost btn-sm" onClick={() => act(`/jobs/quests/${p.id}/verify`, { verified: false })}>REJECT</button>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
};
