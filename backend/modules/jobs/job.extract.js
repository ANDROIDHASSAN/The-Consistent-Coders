// Turns a pasted job post (WhatsApp / LinkedIn text) or a link into a draft for the
// post-job form. Heuristics only — the poster reviews before publishing.
// ponytail: regex heuristics; swap for an LLM call if the miss rate gets annoying.
import dns from 'node:dns/promises';
import net from 'node:net';

const KNOWN_SKILLS = [
    'React', 'React Native', 'Next.js', 'Vue', 'Angular', 'Svelte', 'JavaScript', 'TypeScript', 'Node.js', 'Express',
    'Python', 'Django', 'Flask', 'FastAPI', 'Java', 'Spring', 'Kotlin', 'Swift', 'Flutter', 'Dart', 'Go', 'Rust', 'C++', 'C#', '.NET',
    'PHP', 'Laravel', 'Ruby', 'Rails', 'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Linux', 'Git', 'CI/CD',
    'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'LLM', 'GenAI', 'NLP', 'Data Science', 'Pandas', 'Power BI', 'Tableau', 'Excel',
    'DSA', 'System Design', 'HTML', 'CSS', 'Tailwind', 'Figma', 'UI/UX',
];
const CITIES = ['Bengaluru', 'Bangalore', 'Mumbai', 'Pune', 'Hyderabad', 'Delhi', 'New Delhi', 'Noida', 'Gurgaon', 'Gurugram', 'Chennai', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Indore', 'Chandigarh', 'Kochi', 'Thiruvananthapuram', 'Bhopal', 'Nagpur', 'Surat', 'Lucknow', 'Coimbatore', 'Mysuru'];

const clean = (s) => String(s ?? '')
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}️‍]/gu, '') // emoji
    .replace(/[*_~`]+/g, '') // WhatsApp/markdown emphasis
    .replace(/[ \t]+/g, ' ')
    .trim();
// Labeled value, cut at the next "Label:" so one-line posts ("Location: India Experience: 2 yrs") don't bleed.
const line = (text, rx) => {
    const m = text.match(rx);
    return m ? clean(m[1]).split(/\s+(?=[A-Z][A-Za-z ]{2,25}:\s)/)[0].replace(/[.\s|]+$/, '') : '';
};
const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const extractJobFromText = (raw) => {
    const text = clean(raw).replace(/\r/g, '');
    const lower = text.toLowerCase();
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const out = { title: '', company: '', type: '', workMode: '', experience: '', location: '', salary: '', skills: [], applyUrl: '', description: text.slice(0, 8000) };

    out.applyUrl = (text.match(/https?:\/\/[^\s<>"')\]]+/i) || [''])[0].replace(/[.,;:]+$/, '');

    out.title = line(text, /(?:^|\n)\s*(?:-|•)?\s*(?:role|position|job title|profile|designation|opening)\s*[:\-–]\s*(.+)/i)
        || line(text, /(?:^|\n)\s*hiring\s*[-–:|]+\s*([^\n(]+)/i)
        || line(text, /(?:looking|searching|search) for (?:a |an )?([A-Z][A-Za-z0-9+#./ &-]{3,60}?)(?=\s+(?:at|in|for|with|to)\b|[,.(\n]|$)/)
        || line(text, /(?:^|\n)\s*([A-Z][A-Za-z0-9+#./ &-]{3,60}?)\s*[-–|(]\s*(?:freshers?|experienced|remote|intern)/i);
    if (!out.title && lines[0] && lines[0].length <= 80 && !/https?:/i.test(lines[0])) out.title = lines[0].replace(/^(we are |we're )?hiring[!:\s-]*/i, '').replace(/\s*(?:is|are) hiring.*$/i, '').trim();

    out.company = line(text, /(?:^|\n)\s*(?:-|•)?\s*(?:company|organi[sz]ation|employer|startup)\s*(?:name)?\s*[:\-–]\s*(.+)/i)
        || line(text, /(?:^|\n)\s*([A-Z][A-Za-z0-9&.' -]{1,50}?)\s+(?:is|are)\s+hiring/i)
        || line(text, /\bat\s+([A-Z][A-Za-z0-9&.'-]{1,40}(?:\s+[A-Z][A-Za-z0-9&.'-]{1,40}){0,2})(?=\s*[,.(\n]|\s+(?:for|in|as)\b|$)/);
    if (/^(?:an? |the )?(?:early[- ]stage |ai |tech )?startup$/i.test(out.company)) out.company = '';

    if (/\bintern(ship)?s?\b/i.test(text)) out.type = 'Internship';
    else if (/\bpart[- ]time\b/i.test(text)) out.type = 'Part-time';
    else if (/\bfreelanc/i.test(text)) out.type = 'Freelance';
    else if (/\bcontract\b/i.test(text)) out.type = 'Contract';
    else out.type = 'Full-time';

    if (/\bhybrid\b/i.test(text)) out.workMode = 'Hybrid';
    else if (/\b(?:remote|work from home|wfh)\b/i.test(text)) out.workMode = 'Remote';
    else if (/\b(?:on[- ]?site|in[- ]office|work from office|wfo)\b/i.test(text)) out.workMode = 'On-site';

    out.location = line(text, /(?:^|\n)\s*(?:-|•)?\s*(?:location|city|based in|work location)\s*[:\-–]\s*(.+)/i);
    if (!out.location) {
        const city = CITIES.find((c) => new RegExp(`\\b${escapeRx(c)}\\b`, 'i').test(text));
        if (city) out.location = city;
        else if (out.workMode === 'Remote') out.location = /remote\s*\(india\)/i.test(text) ? 'Remote (India)' : 'Remote';
    }
    if (!out.workMode) out.workMode = out.location && !/remote/i.test(out.location) ? 'On-site' : 'Remote';
    if (!out.location) out.location = 'Remote';

    out.salary = line(text, /(?:^|\n)\s*(?:-|•)?\s*(?:salary|stipend|ctc|package|compensation|pay)\s*[:\-–]\s*(.+)/i)
        || (text.match(/(?:₹|rs\.?|inr)\s?[\d.,]+\s?(?:k|l|lpa|lakhs?|cr)?(?:\s?(?:-|–|to)\s?(?:₹|rs\.?|inr)?\s?[\d.,]+\s?(?:k|l|lpa|lakhs?|cr)?)?(?:\s?(?:lpa|per (?:month|annum|year)|\/(?:month|mo|year|yr)|pm|pa))?/i) || [''])[0].trim()
        || (text.match(/\b\d+(?:\.\d+)?\s?(?:-|–|to)\s?\d+(?:\.\d+)?\s?(?:lpa|lakhs?)\b/i) || [''])[0].trim();

    const skillLine = line(text, /(?:^|\n)\s*(?:-|•)?\s*(?:skills?|tech(?:nologies)?|stack|tech stack|requirements?)\s*(?:required)?\s*[:\-–]\s*(.+)/i);
    if (skillLine) out.skills = skillLine.split(/\s*[,/|•·;]\s*|\s+(?:and|&)\s+/i).map((s) => s.trim()).filter((s) => s && s.length <= 30);
    if (out.skills.length === 0) out.skills = KNOWN_SKILLS.filter((s) => new RegExp(`(?:^|[^A-Za-z0-9+#.])${escapeRx(s)}(?![A-Za-z0-9+#])`, 'i').test(text));
    out.skills = [...new Set(out.skills)].slice(0, 12);

    const yrs = text.match(/(\d+)\s*(?:\+|-\s*\d+|to\s*\d+)?\s*(?:\+\s*)?(?:yrs?|years?)/i);
    if (out.type === 'Internship' || /\bfreshers?\b|\bentry[- ]level\b|\b0\s*-\s*1\b/i.test(text)) out.experience = 'Fresher';
    else if (/\b(?:senior|lead|principal|staff|founding|head of|architect)\b/i.test(lower)) out.experience = 'Senior';
    else if (yrs) { const n = Number(yrs[1]); out.experience = n <= 1 ? 'Fresher' : n <= 3 ? 'Junior' : n <= 6 ? 'Mid' : 'Senior'; }
    else if (/\bjunior\b/i.test(lower)) out.experience = 'Junior';
    else out.experience = 'Fresher';

    out.title = out.title.slice(0, 120);
    out.company = out.company.slice(0, 120);
    return out;
};

// SSRF guard: resolve the host and refuse anything that lands on a loopback / private /
// link-local / ULA address — the page's title+description are echoed back to the caller.
// ponytail: lookup-then-fetch leaves a DNS-rebinding window; pin the resolved IP via an
// undici Agent `connect.lookup` if this ever runs somewhere with a reachable private network.
const isPrivateIp = (ip) => {
    const v = net.isIP(ip);
    if (v === 4) {
        const [a, b] = ip.split('.').map(Number);
        return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
    }
    if (v === 6) {
        const h = ip.toLowerCase();
        if (h === '::' || h === '::1') return true;
        if (h.startsWith('::ffff:')) return isPrivateIp(h.slice(7)); // IPv4-mapped
        return /^(fc|fd|fe[89ab])/.test(h);
    }
    return true; // not an IP literal — caller resolves first
};
const assertPublicUrl = async (target) => {
    if (!/^https?:$/.test(target.protocol)) throw new Error('Only public http(s) links are supported.');
    const host = target.hostname.replace(/^\[|\]$/g, '');
    if (/^(localhost|.*\.local|.*\.internal)$/i.test(host)) throw new Error('Only public http(s) links are supported.');
    const addrs = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true }).catch(() => []);
    if (addrs.length === 0 || addrs.some((a) => isPrivateIp(a.address))) throw new Error('Only public http(s) links are supported.');
};
// Read at most `max` bytes, then cancel — the <head> we need is always near the top.
const readCapped = async (res, max) => {
    const reader = res.body?.getReader();
    if (!reader) return '';
    const chunks = [];
    let size = 0;
    while (size < max) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        size += value.byteLength;
    }
    await reader.cancel().catch(() => {});
    return new TextDecoder().decode(Buffer.concat(chunks, Math.min(size, max)));
};
const meta = (html, prop) => {
    const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${escapeRx(prop)}["'][^>]*content=["']([^"']*)["']`, 'i'))
        || html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${escapeRx(prop)}["']`, 'i'));
    return m ? decodeEntities(m[1]) : '';
};
const decodeEntities = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(n));

/** Fetches a page's title/description (like a chat link preview) and runs the text extractor on it. */
export const extractJobFromUrl = async (url) => {
    let target;
    try { target = new URL(url); } catch { throw new Error('That does not look like a link.'); }

    // Follow redirects by hand so every hop (tinyurl → job board → …) gets the same check.
    const signal = AbortSignal.timeout(8000);
    let res;
    for (let hop = 0; ; hop++) {
        await assertPublicUrl(target);
        res = await fetch(target, { redirect: 'manual', signal, headers: { 'User-Agent': 'WhatsApp/2.23.20 A', Accept: 'text/html,*/*' } });
        const location = res.headers.get('location');
        if (!(res.status >= 300 && res.status < 400 && location)) break;
        if (hop >= 3) throw new Error('Could not read that page. Paste the job text instead.');
        target = new URL(location, target);
    }
    const html = await readCapped(res, 512 * 1024);
    const title = meta(html, 'og:title') || decodeEntities((html.match(/<title[^>]*>([^<]*)<\/title>/i) || ['', ''])[1]);
    const desc = meta(html, 'og:description') || meta(html, 'description');
    if (!title && !desc) throw new Error('Could not read that page. Paste the job text instead.');

    const draft = extractJobFromText(`${title}\n\n${desc}`);
    draft.applyUrl = target.href;
    draft.sourceUrl = draft.applyUrl;
    return draft;
};
