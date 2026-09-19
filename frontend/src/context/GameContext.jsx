/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from '../lib/auth';
import { useApi } from '../lib/api';
import { isSoundOn, play, setSoundOn } from '../utils/sounds';
import { ARENAS } from '../components/Gamification';

const GameContext = createContext(null);

/**
 * Holds the signed-in member's game state (points, rank, badges), the toast
 * queue for "+1 point" moments, and the sound toggle.
 */
export const GameProvider = ({ children }) => {
    const { isSignedIn, isLoaded } = useSession();
    const api = useApi();
    const [me, setMe] = useState(null);
    const [toasts, setToasts] = useState([]);
    const [soundOn, setSound] = useState(() => typeof window !== 'undefined' && isSoundOn());

    // Latest profile for diffing, even when several celebrations run back to back.
    const meRef = useRef(null);

    const refreshMe = useCallback(async () => {
        if (!isSignedIn) {
            meRef.current = null;
            setMe(null);
            return null;
        }
        try {
            const data = await api('/profile/me');
            meRef.current = data;
            setMe(data);
            return data;
        }
        catch {
            return null;
        }
    }, [api, isSignedIn]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from the auth provider is the effect's job
        if (isLoaded) refreshMe();
    }, [isLoaded, refreshMe]);

    const toast = useCallback((message, { kind = 'info', sound } = {}) => {
        const id = Date.now() + Math.random();
        setToasts((list) => [...list, { id, message, kind }].slice(-4));
        if (sound) play(sound);
        setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 4200);
    }, []);

    /** Show the reward from an API response and refresh the profile. */

    /**
     * Show point toasts for one reward or a list of { ...reward, label }, refresh the profile once,
     * then announce anything that changed: overall rank, arena levels, newly unlocked badges.
     */
    const celebrate = useCallback(async (reward, label) => {
        const list = (Array.isArray(reward) ? reward : [{ ...reward, label }]).filter((r) => r?.awarded);
        const before = meRef.current?.user;
        const beforeLevels = Object.fromEntries(Object.entries(before?.arenas ?? {}).map(([k, v]) => [k, v.level]));
        const beforeBadges = new Set((before?.badges ?? []).map((b) => b.id));
        if (list.length) {
            const total = list.reduce((n, r) => n + r.awarded, 0);
            const text = list.length === 1 ? `+${total} point${total > 1 ? 's' : ''} — ${list[0].label}` : `+${total} points — ${list.map((r) => r.label).join(' · ')}`;
            toast(text, { kind: 'points', sound: 'points' });
        }
        const next = await refreshMe();
        if (!next?.user || !list.length || !before) return;
        let delay = 600;
        const later = (msg) => { setTimeout(() => toast(msg, { kind: 'levelup', sound: 'levelUp' }), delay); delay += 900; };
        if (next.user.rank.name !== before.rank?.name) later(`Rank up! You are now a ${next.user.rank.name}`);
        for (const a of ARENAS) {
            const was = beforeLevels[a.id];
            const now = next.user.arenas?.[a.id]?.level;
            if (was && now > was) later(`${a.icon} ${a.label} arena: Level ${now}!`);
        }
        for (const b of next.user.badges ?? []) if (!beforeBadges.has(b.id)) later(`${b.icon} Badge unlocked: ${b.label}`);
    }, [refreshMe, toast]);

    const toggleSound = useCallback(() => {
        const next = !soundOn;
        setSoundOn(next);
        setSound(next);
        if (next) play('success');
    }, [soundOn]);

    const value = useMemo(() => ({
        me, refreshMe, toasts, toast, celebrate, soundOn, toggleSound, play,
    }), [me, refreshMe, toasts, toast, celebrate, soundOn, toggleSound]);

    return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) throw new Error('useGame must be used within GameProvider');
    return context;
};
