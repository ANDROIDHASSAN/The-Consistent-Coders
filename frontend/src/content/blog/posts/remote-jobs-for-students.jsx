import { Link } from 'react-router-dom';

export default function Post() {
    return (
        <>
            <p>Remote developer jobs for students exist, they pay real money, and most of them are never posted on the big portals. Here's where they are, how to spot the fake ones, and what a profile that gets hired remotely looks like.</p>

            <h2>Where the legitimate ones are</h2>
            <table>
                <thead><tr><th>Source</th><th>What you'll find</th><th>Competition</th></tr></thead>
                <tbody>
                    <tr><td><Link to="/jobs?workMode=Remote">TCC job directory</Link></td><td>Remote internships and junior roles posted by members and startups</td><td>Low — dozens, not thousands</td></tr>
                    <tr><td>Startup career pages</td><td>Remote-first companies hiring juniors</td><td>Medium</td></tr>
                    <tr><td>Open-source bounties / GitHub Sponsors</td><td>Paid issues, part-time maintenance</td><td>Low, but skill-gated</td></tr>
                    <tr><td>Twitter/X + LinkedIn "we're hiring" posts</td><td>Founders hiring directly</td><td>Medium; speed matters</td></tr>
                    <tr><td>Freelance platforms</td><td>Short gigs</td><td>High; low rates at first</td></tr>
                </tbody>
            </table>

            <h2>How to spot a scam in ten seconds</h2>
            <ul>
                <li>They ask <strong>you</strong> to pay anything — registration, "training kit", laptop deposit. Always a scam.</li>
                <li>Interview happens entirely over WhatsApp or Telegram with no video call.</li>
                <li>Salary is far above market for a student role with no interview.</li>
                <li>Company has no website, no LinkedIn page, no named humans.</li>
                <li>Offer letter arrives before any technical conversation.</li>
            </ul>

            <h2>What a remote-ready profile looks like</h2>
            <p>Remote employers can't watch you work, so they hire on evidence:</p>
            <ol>
                <li><strong>Public code.</strong> A GitHub with deployed projects and readable READMEs. See <Link to="/blog/github-profile-that-gets-you-hired">the checklist</Link>.</li>
                <li><strong>Written communication.</strong> Your application note, your PR descriptions, your issue comments. Remote work is mostly writing.</li>
                <li><strong>Reliability signals.</strong> A consistent commit graph, a streak on a leaderboard, finished projects rather than started ones.</li>
                <li><strong>Timezone clarity.</strong> State your hours upfront. "Available 10:00–18:00 IST, flexible for 2 hours of overlap" answers the question before it's asked.</li>
            </ol>

            <h2>Applying: the note that gets replies</h2>
            <p>When you apply on <Link to="/jobs">the directory</Link>, the poster sees your note first. Three lines:</p>
            <pre><code>{`Built [project] with [their stack] — live at [url].
I can start [date], [hours] IST.
Happy to do a small paid trial task first.`}</code></pre>
            <p>That last line removes their biggest fear (hiring blind) and separates you from everyone else.</p>

            <blockquote>Filter for <Link to="/jobs?workMode=Remote&experience=Fresher">remote fresher roles</Link> now. Applying earns you a point either way.</blockquote>
        </>
    );
}
