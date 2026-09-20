import { Link } from 'react-router-dom';

export default function Post() {
    return (
        <>
            <p>A good job post is a filter, not an advertisement. It should make the right three people apply and the wrong three hundred skip. Here is the structure that does that, and a template you can paste straight into <Link to="/jobs/new">the post-a-job form</Link>.</p>

            <h2>The title is 60% of the result</h2>
            <p>Candidates and Google both search by exact phrases. Use the phrase a candidate would type:</p>
            <table>
                <thead><tr><th>Weak</th><th>Strong</th></tr></thead>
                <tbody>
                    <tr><td>Developer needed</td><td>React Developer Intern (Remote, 3 months, paid)</td></tr>
                    <tr><td>Backend rockstar</td><td>Junior Node.js Backend Engineer — Bengaluru, hybrid</td></tr>
                    <tr><td>Full-stack ninja</td><td>Full-Stack Developer (Next.js + Postgres), Fresher OK</td></tr>
                </tbody>
            </table>

            <h2>Show the money</h2>
            <p>Listings with a salary or stipend get about twice the applications and far fewer "what's the pay?" messages. A range is fine. "Unpaid" is a filter too — just an honest one.</p>

            <h2>The five-part description</h2>
            <ol>
                <li><strong>One line on what the company does.</strong> Candidates want to know what they'd be building.</li>
                <li><strong>What you'll do</strong> — 3–5 bullets, concrete. "Build the dashboard in React" not "work on frontend".</li>
                <li><strong>What we need</strong> — 3–5 must-haves. If it's not a must-have, it goes in the next section.</li>
                <li><strong>Nice to have</strong> — 1–3 items. This is where freshers decide whether to apply. Keep it short.</li>
                <li><strong>How to apply</strong> — either "apply here" or a link. Say what happens next and how fast.</li>
            </ol>

            <h2>Copy-paste template</h2>
            <pre><code>{`[Company] builds [one line]. We're hiring a [Role] to [outcome].

What you'll do:
-
-
-

What we're looking for:
-
-
-

Nice to have:
-

Details: [Full-time/Internship], [Remote/City], [₹ range], start [date].

How to apply: apply here with a link to something you've built. We reply to everyone within 7 days.`}</code></pre>

            <h2>Mistakes that quietly kill a post</h2>
            <ul>
                <li>Asking for 3 years of experience in a fresher role.</li>
                <li>A skills list with twelve items. Nobody has all twelve; the good ones assume they don't qualify.</li>
                <li>No deadline. Posts with a deadline get applications sooner.</li>
                <li>Not replying. Candidates talk. Ghosting costs you the next hire.</li>
            </ul>

            <blockquote>Ready? <Link to="/jobs/new">Post the job</Link> — it's free, it's indexed by Google as a job listing, and you earn a leaderboard point.</blockquote>
        </>
    );
}
