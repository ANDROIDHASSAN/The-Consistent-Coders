/* eslint-disable react-refresh/only-export-components */
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useGame } from '../context/GameContext';

const EVENT = 'tcc:start-tour';

/** Start the navbar tour from anywhere (end of onboarding, "Replay tour" button). */
export const startTour = () => window.dispatchEvent(new Event(EVENT));

// Each stop points at a real element in the navbar. Stops whose element is missing
// (e.g. desktop links on a phone) are skipped automatically.
const STOPS = [
    { sel: '.nav-link[href="/jobs"]', title: 'Jobs', text: 'Every open role lives here. Filter by skill, remote, internship — or switch to table view.' },
    { sel: '.nav-link[href="/how-it-works"]', title: 'Start here', text: 'The full walkthrough of the platform, any time you need a refresher.' },
    { sel: '.nav-link[href="/projects"]', title: 'Projects', text: 'Ship what you build for +3, collect upvotes (+1 each) and top the Building arena.' },
    { sel: '.nav-link[href="/leaderboard"]', title: 'Leaderboards', text: 'Four arenas — Learning, Building, Hiring, Applying — all-time and weekly. Pick one and climb.' },
    { sel: '.auth-score', title: 'Your score', text: 'Points and rank, always visible. Click it to open your dashboard.' },
    { sel: '.sound-toggle', title: 'Sounds', text: 'Turn on satisfying sound effects for points and rank-ups.' },
    { sel: '.hamburger', title: 'Menu', text: 'Everything lives here: jobs, post a job, leaderboard, blog, your dashboard.' },
];

const visible = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };

export const NavTour = () => {
    const { play } = useGame();
    const [stops, setStops] = useState(null);
    const [i, setI] = useState(0);
    const [rect, setRect] = useState(null);

    useEffect(() => {
        const begin = () => {
            window.scrollTo(0, 0);
            const nav = document.getElementById('mainNav');
            if (nav) nav.style.transform = 'none'; // navbar may be hidden by scroll-hide
            const found = STOPS.filter((s) => visible(document.querySelector(s.sel)));
            if (found.length) { setStops(found); setI(0); }
        };
        window.addEventListener(EVENT, begin);
        return () => window.removeEventListener(EVENT, begin);
    }, []);

    const measure = useCallback(() => {
        if (!stops) return;
        const el = document.querySelector(stops[i].sel);
        if (!visible(el)) { setRect(null); return; }
        const r = el.getBoundingClientRect();
        setRect({ top: r.top - 8, left: r.left - 8, width: r.width + 16, height: r.height + 16 });
    }, [stops, i]);

    useLayoutEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- measuring the DOM is this effect's job
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [measure]);

    const close = useCallback(() => { setStops(null); setRect(null); }, []);

    useEffect(() => {
        if (!stops) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape') close();
            if (e.key === 'ArrowRight') setI((n) => (n + 1 < stops.length ? n + 1 : n));
            if (e.key === 'ArrowLeft') setI((n) => Math.max(0, n - 1));
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [stops, close]);

    if (!stops || !rect) return null;
    const stop = stops[i];
    const last = i === stops.length - 1;
    const cardLeft = Math.min(Math.max(12, rect.left + rect.width / 2 - 160), window.innerWidth - 332);

    return (
        <div className="tour" role="dialog" aria-modal="true" aria-labelledby="tour-title">
            <div className="tour-hole" style={rect} aria-hidden="true" />
            <div className="tour-card" style={{ top: rect.top + rect.height + 14, left: cardLeft }}>
                <p className="mono-text tour-count">{i + 1} / {stops.length}</p>
                <h3 id="tour-title">{stop.title}</h3>
                <p>{stop.text}</p>
                <div className="tour-actions">
                    <button type="button" className="onb-skip mono-text" onClick={close}>Skip tour</button>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {i > 0 && <button type="button" className="btn-ghost btn-sm" onClick={() => { play('click'); setI(i - 1); }}>Back</button>}
                        <button type="button" className="btn-ghost btn-sm tour-next" autoFocus onClick={() => { play(last ? 'success' : 'click'); if (last) close(); else setI(i + 1); }}>
                            {last ? 'Done ✓' : 'Next →'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
