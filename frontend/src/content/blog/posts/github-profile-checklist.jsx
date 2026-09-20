import { Link } from 'react-router-dom';

export default function Post() {
    return (
        <>
            <p>A recruiter opens your GitHub, scrolls for thirty seconds, and forms an opinion. This checklist is what they are looking at, in the order they look.</p>

            <h2>Above the fold (first 5 seconds)</h2>
            <ul>
                <li><strong>Real name and photo.</strong> Not an anime avatar. They need to match your resume.</li>
                <li><strong>Bio with your stack and status.</strong> "Final-year CS · React/Node · open to fresher roles from June 2026".</li>
                <li><strong>Location and a link</strong> — portfolio, LinkedIn, or your best deployed project.</li>
                <li><strong>Contribution graph that isn't empty.</strong> Consistency beats intensity: 4 commits a week for a year looks better than 200 in one month.</li>
            </ul>

            <h2>Pinned repositories (next 10 seconds)</h2>
            <p>Pin exactly 3–6 repos. Each pinned repo needs:</p>
            <table>
                <thead><tr><th>Item</th><th>Check</th></tr></thead>
                <tbody>
                    <tr><td>Descriptive name</td><td><code>job-board-mern</code>, not <code>project2</code></td></tr>
                    <tr><td>One-line description filled in</td><td>Shows on the profile card</td></tr>
                    <tr><td>Topics/tags set</td><td>react, nodejs, mongodb — searchable</td></tr>
                    <tr><td>Live link in the About box</td><td>The 🔗 field next to the description</td></tr>
                    <tr><td>README with a screenshot in the first screen</td><td>Recruiters don't clone; they scroll</td></tr>
                </tbody>
            </table>

            <h2>The README (next 15 seconds)</h2>
            <p>The structure that works, top to bottom:</p>
            <ol>
                <li>One sentence: what it is and who it's for.</li>
                <li>A screenshot or 10-second GIF.</li>
                <li>Live demo link + test credentials if it needs login.</li>
                <li>Tech stack as a short list.</li>
                <li>"The interesting part" — one paragraph about the hardest problem you solved.</li>
                <li>How to run it locally (three commands max).</li>
            </ol>

            <h2>What to delete</h2>
            <ul>
                <li>Tutorial clones with the tutorial's name still in the README.</li>
                <li>Empty repos, "test" repos, repos with one commit called "init".</li>
                <li>Forks you never touched — or at least unpin them; they clutter the profile.</li>
                <li>Committed <code>.env</code> files. Rotate the keys, then remove them from history.</li>
            </ul>

            <h2>Bonus signals</h2>
            <ul>
                <li>One merged PR to any open-source project. Even a docs fix. It proves you can work in someone else's codebase.</li>
                <li>A profile README (repo named after your username) with your current focus and what you're looking for.</li>
                <li>Issues and PRs with clear writing. Remote employers hire on writing.</li>
            </ul>

            <blockquote>Fix your profile tonight, then <Link to="/jobs">apply to a role</Link> with the link in your note. Applications on the directory show the poster your link first.</blockquote>
        </>
    );
}
