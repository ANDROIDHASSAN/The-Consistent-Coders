// Tiny synthesised UI sounds via Web Audio — no audio files, no dependency.
// Muted by default until the user opts in (browsers block autoplay anyway).

const STORAGE_KEY = 'tcc_sound';
let ctx = null;

const getCtx = () => {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!ctx) ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
};

export const isSoundOn = () => {
    try {
        return localStorage.getItem(STORAGE_KEY) === 'on';
    }
    catch {
        return false;
    }
};

export const setSoundOn = (on) => {
    try {
        localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
    }
    catch {
        // private mode — sound preference just won't persist
    }
    if (on) getCtx();
};

const tone = (freq, { type = 'sine', duration = 0.12, gain = 0.08, delay = 0 } = {}) => {
    const audio = getCtx();
    if (!audio) return;
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audio.currentTime + delay);
    amp.gain.setValueAtTime(0, audio.currentTime + delay);
    amp.gain.linearRampToValueAtTime(gain, audio.currentTime + delay + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + delay + duration);
    osc.connect(amp).connect(audio.destination);
    osc.start(audio.currentTime + delay);
    osc.stop(audio.currentTime + delay + duration + 0.05);
};

const SOUNDS = {
    click: () => tone(520, { type: 'triangle', duration: 0.06, gain: 0.05 }),
    hover: () => tone(880, { type: 'sine', duration: 0.04, gain: 0.02 }),
    success: () => { tone(523, { duration: 0.1 }); tone(659, { duration: 0.1, delay: 0.09 }); tone(784, { duration: 0.18, delay: 0.18 }); },
    points: () => { tone(988, { type: 'square', duration: 0.08, gain: 0.04 }); tone(1319, { type: 'square', duration: 0.14, gain: 0.04, delay: 0.08 }); },
    levelUp: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, { type: 'triangle', duration: 0.22, gain: 0.07, delay: i * 0.11 })),
    error: () => tone(180, { type: 'sawtooth', duration: 0.2, gain: 0.05 }),
};

export const play = (name) => {
    if (!isSoundOn()) return;
    try {
        SOUNDS[name]?.();
    }
    catch {
        // audio is best-effort; never let it break the UI
    }
};
