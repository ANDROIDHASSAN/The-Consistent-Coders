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
    'Claude', 'OpenAI', 'LangChain', 'MCP', 'RAG', 'AI Agents', 'Agentic AI', 'Prompt Engineering',
    'SEO', 'Copywriting', 'Canva', 'Photoshop', 'Premiere Pro', 'After Effects', 'Video Editing', 'Social Media', 'Content Writing',
];
// Also plain English words ("go live", "express interest"): only count them written as the tech name.
const CASE_SENSITIVE = new Set(['Go', 'Rust', 'Swift', 'Spring', 'Express', 'Rails', 'Ruby', 'Dart', 'REST', 'Excel', 'Git', 'Vue', 'RAG']);
// Posts write "ReactJS", "Node JS", "VueJS"; read them as the names above.
const SKILL_SPELLINGS = [[/\bReact\s?\.?js\b/gi, 'React'], [/\bNode\s?\.?js\b/gi, 'Node.js'], [/\bNext\s?\.?js\b/gi, 'Next.js'], [/\bVue\s?\.?js\b/gi, 'Vue'], [/\bExpress\s?\.?js\b/gi, 'Express']];
// A short line naming a role, the way multi-role posts list them ("Creative Intern", "Backend Developer").
const ROLE_LINE = /^[A-Z][A-Za-z0-9+#./&() -]{2,55}\b(?:intern|developer|engineer|designer|writer|analyst|manager|executive|associate|specialist|scientist|architect|consultant|lead|tester|sdet|trainee|editor|marketer|strategist|recruiter|admin(?:istrator)?)s?$/i;
// Headings are Title Case ("Social Media Writer Intern"); a sentence ("Report to the Engineering Manager") is not.
const isRoleHeading = (l) => {
    const words = l.split(' ');
    return words.length <= 6 && ROLE_LINE.test(l) && words.every((w) => /^[A-Z0-9(&/+-]/.test(w) || /^(?:and|of|for|&)$/.test(w));
};
const CITIES = ['Bengaluru', 'Bangalore', 'Mumbai', 'Pune', 'Hyderabad', 'Delhi', 'New Delhi', 'Noida', 'Gurgaon', 'Gurugram', 'Chennai', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Indore', 'Chandigarh', 'Kochi', 'Thiruvananthapuram', 'Bhopal', 'Nagpur', 'Surat', 'Lucknow', 'Coimbatore', 'Mysuru'];

const clean = (s) => String(s ?? '')
    .normalize('NFKC') // LinkedIn "bold" headings (𝐇𝐎𝐍𝐄𝐘𝐖𝐄𝐋𝐋) are math letters; NFKC makes them A–Z
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
const isHashtagLine = (l) => /^(?:#[\p{L}\p{N}_]+[\s,]*)+$/u.test(l.trim());
export const EMAIL_RX = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;
export const NOT_AVAILABLE = 'Not available';
const titleCase = (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();

/**
 * A LinkedIn post link names its author (/posts/<handle>_…), so the poster's profile
 * comes from the URL alone, without fetching LinkedIn. Returns null for non-post links.
 */
export const linkedinPost = (url) => {
    let u;
    try { u = new URL(url); } catch { return null; }
    if (!/(^|\.)linkedin\.com$/i.test(u.hostname)) return null;
    const m = u.pathname.match(/^\/posts\/([^/_]{3,100})_/);
    if (!m && !/^\/feed\/update\/urn:li:(?:activity|share|ugcPost):\d+/.test(u.pathname)) return null;
    let handle = '';
    try { handle = m ? decodeURIComponent(m[1]) : ''; } catch { /* malformed escape: keep the post, drop the handle */ }
    return {
        sourceUrl: `https://www.linkedin.com${u.pathname.replace(/\/+$/, '')}`, // no query: one post, one URL
        poster: handle
            ? { name: handle.split('-').filter((p) => p && !/\d/.test(p)).map(titleCase).join(' ').slice(0, 80), profileUrl: `https://www.linkedin.com/in/${encodeURIComponent(handle)}` }
            : { name: '', profileUrl: '' },
    };
};

/** A LinkedIn activity id carries its own timestamp: the top 41 bits are epoch milliseconds. */
export const linkedinPostDate = (url, now = Date.now()) => {
    const id = String(url ?? '').match(/(?:activity|share|ugcPost)[-:](\d{18,20})/)?.[1];
    if (!id) return null;
    const ms = Number(BigInt(id) >> 22n);
    return ms > Date.UTC(2012, 0, 1) && ms <= now ? new Date(ms) : null;
};

export const extractJobFromText = (raw) => {
    const text = clean(raw).replace(/\r/g, '');
    const lower = text.toLowerCase();
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const out = {
        // Hashtag-only lines help the extractor below but are noise on the listing.
        title: '', company: '', type: '', workMode: '', experience: '', location: '', salary: '', skills: [], applyUrl: '',
        description: text.split('\n').filter((l) => !isHashtagLine(l) || !l.trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, 8000),
        sourceUrl: '', poster: { name: '', profileUrl: '' }, companyLinkedin: '', contactEmails: [],
    };

    // Links and emails come from the raw text: clean() drops underscores, which URLs and emails use.
    const urls = (String(raw ?? '').match(/https?:\/\/[^\s<>"')\]]+/gi) || []).map((u) => u.replace(/[.,;:]+$/, ''));
    const post = urls.map(linkedinPost).find(Boolean);
    if (post) Object.assign(out, post);
    const companyPage = urls.map((u) => u.match(/linkedin\.com\/company\/([^/?#\s]+)/i)).find(Boolean);
    if (companyPage) out.companyLinkedin = `https://www.linkedin.com/company/${companyPage[1]}`;
    out.contactEmails = [...new Set((String(raw ?? '').match(EMAIL_RX) || []).map((e) => e.toLowerCase()))].slice(0, 5);
    // Prefer a real application link, then an email, then the post itself (apply by DM/comment).
    out.applyUrl = urls.find((u) => !/linkedin\.com\/(?:posts|feed|in|company)\//i.test(u))
        || (out.contactEmails[0] ? `mailto:${out.contactEmails[0]}` : '')
        || out.sourceUrl;

    out.title = line(text, /(?:^|\n)\s*(?:-|•)?\s*(?:role|position|job title|profile|designation|opening)\s*[:\-–]\s*(.+)/i)
        || line(text, /(?:^|\n)\s*hiring\s*[-–:|]+\s*([^\n(]+)/i)
        || line(text, /(?:looking|searching|search) for (?:a |an )?([A-Z][A-Za-z0-9+#./ &-]{3,60}?)(?=\s+(?:at|in|for|with|to)\b|[,.(\n]|$)/)
        || line(text, /(?:^|\n)\s*([A-Z][A-Za-z0-9+#./ &-]{3,60}?)\s*[-–|(]\s*(?:freshers?|experienced|remote|intern)/i);
    // "We're hiring 2 interns…" then one heading per role: the roles are the title, not the opener.
    const roles = [...new Set(lines.map((l) => l.replace(/^[-•\d.)\s]+/, '').replace(/[:\s]+$/, '')).filter(isRoleHeading))];
    if (!out.title && roles.length) out.title = roles.slice(0, 3).join(' & ');
    if (!out.title && lines[0] && lines[0].length <= 80 && !/https?:/i.test(lines[0])) out.title = lines[0].replace(/^(we are |we're )?hiring[!:\s-]*/i, '').replace(/\s*(?:is|are) hiring.*$/i, '').trim();

    out.company = line(text, /(?:^|\n)\s*(?:-|•)?\s*(?:company|organi[sz]ation|employer|startup)\s*(?:name)?\s*[:\-–]\s*(.+)/i)
        || line(text, /(?:^|\n)\s*([A-Z][A-Za-z0-9&.' -]{1,50}?)\s+(?:is|are)\s+hiring/i)
        || line(text, /\bat\s+([A-Z][A-Za-z0-9&.'-]{1,40}(?:\s+[A-Z][A-Za-z0-9&.'-]{1,40}){0,2})(?=\s*[,.(\n]|\s+(?:for|in|as)\b|$)/);
    if (/^(?:an? |the )?(?:early[- ]stage |ai |tech )?startup$/i.test(out.company)) out.company = '';
    // "HONEYWELL AEROSPACE" → "Honeywell Aerospace"; short acronyms (IBM, TCS) stay.
    if (out.company === out.company.toUpperCase()) out.company = out.company.replace(/[A-Z]{4,}/g, titleCase);

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
    // Unknown is said out loud rather than guessed as "Remote": the admin pastes and publishes.
    if (!out.workMode) out.workMode = 'On-site';
    if (!out.location) out.location = NOT_AVAILABLE;
    if (!out.company) out.company = NOT_AVAILABLE;

    out.salary = line(text, /(?:^|\n)\s*(?:-|•)?\s*(?:salary|stipend|ctc|package|compensation|pay)\s*[:\-–]\s*(.+)/i)
        // \b and a leading digit: "doctors, check" must not read as "rs,".
        || (text.match(/(?:₹|\brs\.?|\binr)\s?\d[\d.,]*\s?(?:k|l|lpa|lakhs?|cr)?(?:\s?(?:-|–|to)\s?(?:₹|rs\.?|inr)?\s?\d[\d.,]*\s?(?:k|l|lpa|lakhs?|cr)?)?(?:\s?(?:lpa|per (?:month|annum|year)|\/(?:month|mo|year|yr)|pm|pa)\b)?/i) || [''])[0].trim().replace(/[.,]+$/, '')
        || (text.match(/\b\d+(?:\.\d+)?\s?(?:-|–|to)\s?\d+(?:\.\d+)?\s?(?:lpa|lakhs?)\b/i) || [''])[0].trim();

    const skillLine = line(text, /(?:^|\n)\s*(?:-|•)?\s*(?:skills?|tech(?:nologies)?|stack|tech stack|requirements?)\s*(?:required)?\s*[:\-–]\s*(.+)/i);
    if (skillLine) out.skills = skillLine.split(/\s*[,/|•·;]\s*|\s+(?:and|&)\s+/i).map((s) => s.trim()).filter((s) => s && s.length <= 30);
    const skillText = SKILL_SPELLINGS.reduce((t, [rx, name]) => t.replace(rx, name), text);
    if (out.skills.length === 0) out.skills = KNOWN_SKILLS.filter((s) => new RegExp(`(?:^|[^A-Za-z0-9+#.])${escapeRx(s)}(?![A-Za-z0-9+#])`, CASE_SENSITIVE.has(s) ? '' : 'i').test(skillText));
    out.skills = [...new Set(out.skills)].slice(0, 12);

    const yrs = text.match(/(\d+)\s*(?:\+|-\s*\d+|to\s*\d+)?\s*(?:\+\s*)?(?:yrs?|years?)/i);
    if (out.type === 'Internship' || /\bfreshers?\b|\bentry[- ]level\b|\b0\s*-\s*1\b/i.test(text)) out.experience = 'Fresher';
    else if (/\b(?:senior|lead|principal|staff|founding|head of|architect)\b/i.test(lower)) out.experience = 'Senior';
    else if (yrs) { const n = Number(yrs[1]); out.experience = n <= 1 ? 'Fresher' : n <= 3 ? 'Junior' : n <= 6 ? 'Mid' : 'Senior'; }
    else if (/\bjunior\b/i.test(lower)) out.experience = 'Junior';
    else out.experience = 'Fresher';

    // "Klimb, Associate Product Manager, Remote" → "Associate Product Manager": company and work mode have their own fields.
    if (out.company !== NOT_AVAILABLE) out.title = out.title.replace(new RegExp(`^${escapeRx(out.company)}\\s*[,:|–-]\\s*`, 'i'), '');
    out.title = out.title.replace(/\s*[,|(–-]\s*(?:remote|hybrid|on[- ]?site|wfh)\)?$/i, '');
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
const decodeEntities = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(n))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&nbsp;/g, ' ');

const textOf = (s) => decodeEntities(String(s ?? '').replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const LINKEDIN_TYPE = { 'Full-time': 'Full-time', 'Part-time': 'Part-time', Internship: 'Internship', Contract: 'Contract', Temporary: 'Contract' };

/** A public LinkedIn job page (/jobs/view/…) carries the role in its top card, criteria list and full description. */
export const linkedinJob = (html) => {
    const title = textOf((html.match(/<h1[^>]*top-card-layout__title[^>]*>([\s\S]*?)<\/h1>/) || [])[1]);
    if (!title) return null;
    const criteria = Object.fromEntries([...html.matchAll(/job-criteria-subheader[^>]*>([\s\S]*?)<\/h3>\s*<span[^>]*job-criteria-text[^>]*>([\s\S]*?)<\/span>/g)].map((m) => [textOf(m[1]), textOf(m[2])]));
    const body = (html.match(/show-more-less-html__markup[^>]*>([\s\S]*?)<\/div>/) || [])[1] ?? '';
    return {
        title,
        company: textOf((html.match(/topcard__org-name-link[^>]*>([\s\S]*?)<\/a>/) || [])[1]),
        companySlug: (html.match(/topcard__org-name-link[^>]*href="[^"]*\/company\/([^/?"#]+)/) || [])[1] ?? '',
        location: textOf((html.match(/topcard__flavor--bullet[^>]*>([\s\S]*?)<\/span>/) || [])[1]),
        salary: textOf((html.match(/compensation__salary"[^>]*>([\s\S]*?)<\/div>/) || [])[1]),
        seniority: criteria['Seniority level'] ?? '',
        employment: criteria['Employment type'] ?? '',
        description: decodeEntities(body.replace(/<li[^>]*>/gi, '- ').replace(/<br\s*\/?>|<\/(?:p|li|ul|ol|h\d)>/gi, '\n').replace(/<[^>]+>/g, ''))
            .replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim(),
    };
};

/**
 * The text to extract from. LinkedIn's og:title is the post's opening cut with "…" plus " | Author",
 * and og:description is the whole post, so the title is only kept when it adds something.
 */
export const ogText = (title, desc, byline = '') => {
    const head = (byline ? title.replace(/\s*\|[^|]*$/, '') : title).replace(/\s*(?:…|\.\.\.)\s*$/, '').trim();
    const flat = (s) => s.replace(/\s+/g, ' ').trim();
    if (!desc) return head;
    if (isHashtagLine(head)) return desc; // a post that opens with hashtags gets them as its og:title
    return flat(desc).startsWith(flat(head).slice(0, 60)) ? desc : `${head}\n\n${desc}`;
};

/** Fetches a page's title/description (like a chat link preview) and runs the text extractor on it. */
export const extractJobFromUrl = async (url) => {
    let target;
    try { target = new URL(url); } catch { throw new Error('That does not look like a link.'); }
    const linkedinJobId = /(^|\.)linkedin\.com$/i.test(target.hostname) ? target.searchParams.get('currentJobId') : null;
    if (/^\d+$/.test(linkedinJobId ?? '')) target = new URL(`https://www.linkedin.com/jobs/view/${linkedinJobId}`);
    // A company or profile page only gives LinkedIn's sign-in wall, never a job.
    if (/(^|\.)linkedin\.com$/i.test(target.hostname) && !linkedinPost(target.href) && !/^\/jobs\/view\//.test(target.pathname)) {
        throw new Error('That does not look like a job post: it is a LinkedIn company or profile page. Open the post, tap ⋯ → Copy link to post, and paste that.');
    }

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
    // A 404 / 403 page's title ("LinkedIn", "Just a moment…") is never the job.
    if (!res.ok) throw new Error('Could not read that page. Paste the job text instead.');
    const html = await readCapped(res, 512 * 1024);
    // LinkedIn can end og:title with a count ("… | Anmol Kaur | 12 comments"); that segment is not the author.
    const title = (meta(html, 'og:title') || decodeEntities((html.match(/<title[^>]*>([^<]*)<\/title>/i) || ['', ''])[1]))
        .replace(/(?:\s*\|\s*[\d,.]+[km]?\+?\s+[a-z]+)+\s*$/i, '');
    const desc = meta(html, 'og:description') || meta(html, 'description');
    if (!title && !desc) throw new Error('Could not read that page. Paste the job text instead.');
    if (/^(?:linkedin login|sign in|sign up|log in|join linkedin)\b/i.test(title) || /\/(?:login|authwall|signup)\b/.test(target.pathname)) {
        throw new Error('Could not read that post: LinkedIn showed its sign-in page. Paste the post text instead.');
    }

    const post = linkedinPost(target.href);
    // ponytail: og:title shape ("… | Name" or "Name on LinkedIn: …") is LinkedIn's to change; the URL handle is the fallback.
    const byline = post ? (title.match(/\|\s*([^|]{2,80}?)\s*$/) || title.match(/^(.{2,80}?) on LinkedIn:/) || [])[1] : '';
    const job = /^\/jobs\/view\//.test(target.pathname) ? linkedinJob(html) : null;
    const draft = extractJobFromText(job ? `${job.title}\n${job.description}` : ogText(title, desc, byline));
    if (post) {
        Object.assign(draft, post);
        if (byline && !/^linkedin$/i.test(byline)) draft.poster.name = byline.trim();
        if (!draft.applyUrl || draft.applyUrl === post.sourceUrl) draft.applyUrl = post.sourceUrl;
    }
    else draft.applyUrl = target.href;
    if (job) {
        const level = {
            Internship: 'Fresher', 'Entry level': draft.experience === 'Fresher' ? 'Fresher' : 'Junior', Associate: 'Junior',
            'Mid-Senior level': draft.experience === 'Senior' ? 'Senior' : 'Mid', Director: 'Senior', Executive: 'Senior',
        }[job.seniority];
        Object.assign(draft, {
            title: job.title.slice(0, 120),
            company: job.company.slice(0, 120) || draft.company,
            location: job.location || draft.location,
            salary: job.salary || draft.salary,
            type: LINKEDIN_TYPE[job.employment] ?? draft.type,
            experience: level ?? draft.experience,
            description: (job.description || draft.description).slice(0, 8000),
            companyLinkedin: job.companySlug ? `https://www.linkedin.com/company/${job.companySlug}` : draft.companyLinkedin,
        });
    }
    return draft;
};
