import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../lib/api';
import { useGame } from '../context/GameContext';
import { heatOf, QUEST_STEPS } from '../lib/jobs';

/** Your pipeline for one job: tap the stage you've reached. Each stage pays once; reply, interview and offer pay after an admin checks your proof. */
export const QuestPanel = ({ job, onChange }) => {
    const api = useApi();
    const { celebrate, toast } = useGame();
    const [busy, setBusy] = useState(false);
    const [claiming, setClaiming] = useState(null); // the proof stage whose form is open
    const [proof, setProof] = useState({ url: '', note: '' });
    const current = QUEST_STEPS.findIndex((s) => s.id === job.quest?.stage);
    const verifiedAt = QUEST_STEPS.findIndex((s) => s.id === (job.quest?.verified || 'reached'));
    const pending = job.quest?.proof?.status === 'pending' ? job.quest.proof : null;
    const rejected = job.quest?.proof?.status === 'rejected' ? job.quest.proof : null;
    const heat = heatOf(job);
    const stepOf = (id) => QUEST_STEPS.find((s) => s.id === id);

    const pick = (s, i) => (s.proof && i > verifiedAt ? setClaiming(s) : move(s.id));

    const move = async (stage, body = {}) => {
        setBusy(true);
        try {
            const res = await api(`/jobs/${job.id}/quest`, { method: 'PUT', body: { stage, ...body } });
            onChange(res.quest);
            setClaiming(null);
            if (res.quest?.proof?.status === 'pending') toast(`Proof sent! +${stepOf(stage).pts} lands once an admin checks it.`, { kind: 'success', sound: 'success' });
            await celebrate(res.rewards);
        }
        catch (err) {
            toast(err.message, { kind: 'error', sound: 'error' });
        }
        finally {
            setBusy(false);
        }
    };

    return (
        <div className="panel">
            {heat?.earlyBirdHours && current < 1 && (
                <p className="quest-early mono-text">🐦 EARLY BIRD: reach out in the next {heat.earlyBirdHours}h for +2 bonus</p>
            )}
            <ol className="quest-steps">
                {QUEST_STEPS.map((s, i) => (
                    <li key={s.id}>
                        <button type="button" className={i <= current ? 'is-done' : ''} aria-pressed={i === current} disabled={busy || (i === current && rejected?.stage !== s.id)} onClick={() => pick(s, i)}>
                            <span aria-hidden="true">{s.icon}</span> {s.label}
                            {s.pts > 0 && <small>+{s.pts}</small>}
                        </button>
                    </li>
                ))}
            </ol>
            {claiming && (
                <form className="quest-proof" onSubmit={(e) => { e.preventDefault(); move(claiming.id, { proofUrl: proof.url, proofNote: proof.note }); }}>
                    <label className="field">
                        <span>{claiming.icon} Proof for “{claiming.label}” (+{claiming.pts} once verified)</span>
                        <input type="url" required maxLength={500} placeholder="https://drive.google.com/… (screenshot of the email, invite or offer letter)" value={proof.url} onChange={(e) => setProof({ ...proof, url: e.target.value })} />
                    </label>
                    <label className="field">
                        <span>Note for the admin (optional)</span>
                        <input maxLength={300} placeholder="e.g. HR replied on LinkedIn, round 1 on Monday" value={proof.note} onChange={(e) => setProof({ ...proof, note: e.target.value })} />
                    </label>
                    <p className="field-hint">Share the link as “anyone with the link can view”. Hide salary or personal details if you like; only admins see it.</p>
                    <div className="pill-row">
                        <button type="submit" className="btn-ghost btn-sm" disabled={busy}>SEND PROOF</button>
                        <button type="button" className="link-btn" onClick={() => setClaiming(null)}>cancel</button>
                    </div>
                </form>
            )}
            {pending && <p className="field-hint">⏳ {stepOf(pending.stage).label} waiting for admin verification. +{stepOf(pending.stage).pts} lands once it's checked.</p>}
            {rejected && <p className="field-hint">The admins couldn't verify your {stepOf(rejected.stage).label.toLowerCase()} proof. Tap the stage again to send a clearer one.</p>}
            {job.quest?.verified === 'offer' && <p className="field-hint">🏅 Verified offer. You're on the Wall of Wins!</p>}
            <p className="field-hint" style={{ marginTop: '0.75rem' }}>
                Track every job you chase here. Replies, interviews and offers need a proof link; an admin checks it before the points land.
                {job.quest && <> · <button type="button" className="link-btn" disabled={busy} onClick={() => move('none')}>remove</button></>}
            </p>
        </div>
    );
};

/** Members at this company who'll refer. Joining needs your profile's org to name the company. */
export const InsiderPanel = ({ job, me, onToggle }) => {
    const api = useApi();
    const { celebrate, toast } = useGame();
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const mine = job.insiders?.find((i) => i.isMe);

    const toggle = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const res = await api(`/jobs/${job.id}/insider`, { method: 'POST', body: { note } });
            onToggle();
            await celebrate(res.reward, 'insider referral offered');
        }
        catch (err) {
            toast(err.message, { kind: 'error', sound: 'error' });
        }
        finally {
            setBusy(false);
        }
    };

    return (
        <div className="panel">
            {job.insiders?.length > 0 ? (
                <ul className="insider-list">
                    {job.insiders.map((i) => (
                        <li key={i.id}>
                            <Link to={`/members/${i.id}`}><strong>🤝 {i.name}</strong></Link>
                            {i.headline && <small> · {i.headline}</small>}
                            {i.note && <p>{i.note}</p>}
                        </li>
                    ))}
                </ul>
            ) : (
                <p style={{ marginBottom: '1rem' }}>No insiders yet. Work at {job.company}? A referral beats a cold application every time.</p>
            )}
            {mine ? (
                <button type="button" className="btn-ghost btn-sm" disabled={busy} onClick={toggle}>Stop offering referrals</button>
            ) : (
                <form onSubmit={toggle} style={{ display: 'grid', gap: '0.5rem', marginTop: '1rem' }}>
                    <label className="field">
                        <span>I work at {job.company} and can refer (+2 pts)</span>
                        <input maxLength={200} placeholder="e.g. DM me your GitHub, I'll refer strong fits" value={note} onChange={(e) => setNote(e.target.value)} />
                    </label>
                    <button type="submit" className="btn-ghost btn-sm" disabled={busy}>OFFER REFERRALS</button>
                    {!me?.user?.org && <p className="field-hint">Set your company on your <Link to="/profile">profile</Link> first.</p>}
                </form>
            )}
        </div>
    );
};
