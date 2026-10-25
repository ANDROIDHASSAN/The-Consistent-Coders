import { ImageResponse } from '@vercel/og';
import { cityOf, isPlaceholder } from '../../../frontend/src/content/jobCategories.js';

const ACCENT = '#ccff00';
const h = (type, style, children) => ({ type, props: { style: { display: 'flex', ...style }, children } });
const chip = (text) => h('div', { padding: '10px 22px', border: '2px solid #3a3a3a', borderRadius: 999, fontSize: 30, color: '#e8e8e8' }, text);

/** The 1200×630 card a chat app or social feed shows when a job link is shared. */
export const jobOgImage = (job, closed = false) => {
    const company = isPlaceholder(job.company) ? '' : job.company;
    const place = job.workMode === 'Remote' ? 'Remote' : cityOf(job.location)?.name || (isPlaceholder(job.location) ? '' : job.location.split(/[,(]/)[0].trim());
    const title = job.title.length > 60 ? `${job.title.slice(0, 57).replace(/\s+\S*$/, '')}…` : job.title;
    const chips = [closed ? 'Applications closed' : job.type, place, job.experience].filter(Boolean);
    return new ImageResponse(
        h('div', { width: '100%', height: '100%', flexDirection: 'column', justifyContent: 'space-between', background: '#050505', color: '#fafafa', padding: '64px 72px 0', fontFamily: 'Geist' }, [
            h('div', { flexDirection: 'column' }, [
                h('div', { fontSize: 28, letterSpacing: 2, color: ACCENT }, '// THE CONSISTENT CODERS'),
                h('div', { fontSize: 40, color: '#b5b5b5', marginTop: 44 }, company ? `${company} is hiring` : 'Now hiring'),
                h('div', { fontSize: title.length > 34 ? 64 : 84, lineHeight: 1.05, marginTop: 12, letterSpacing: -1 }, title),
                h('div', { gap: 16, marginTop: 36, flexWrap: 'wrap' }, chips.map(chip)),
                ...(job.salary ? [h('div', { fontSize: 38, color: ACCENT, marginTop: 28 }, job.salary)] : []),
            ]),
            h('div', { flexDirection: 'column' }, [
                h('div', { justifyContent: 'space-between', fontSize: 30, color: '#b5b5b5', paddingBottom: 28 }, [h('div', {}, 'Apply free · get referred'), h('div', { color: '#fafafa' }, 'consistentcoders.com')]),
                h('div', { height: 14, margin: '0 -72px', background: ACCENT }, []),
            ]),
        ]),
        { width: 1200, height: 630 },
    );
};
