import { Link } from 'react-router-dom';

export default function Post() {
    return (
        <>
            <p>Every interviewer has seen a thousand to-do apps, weather apps and Netflix clones. They prove you followed a tutorial. The projects below prove you can be trusted with a feature. Each one has a hard part — the thing you will talk about in the interview.</p>

            <h2>1. A job board with applications (React + Node + MongoDB)</h2>
            <p><strong>The hard part:</strong> authentication, ownership rules (only the poster can edit), idempotent actions (applying twice shouldn't count twice), and search with filters.</p>
            <p>It's a CRUD app with real business rules — which is what 80% of software jobs are. Bonus: you can look at how <Link to="/jobs">ours</Link> is built on GitHub.</p>

            <h2>2. A URL shortener with analytics (Any backend + Redis/Postgres)</h2>
            <p><strong>The hard part:</strong> generating unique short codes at scale, redirect latency, and counting clicks without slowing the redirect. Great excuse to learn caching and indexes.</p>

            <h2>3. A real-time chat or collaborative editor (WebSockets)</h2>
            <p><strong>The hard part:</strong> presence, reconnection, message ordering, and what happens when two people type at once. Socket.io on Node or Django Channels both work.</p>

            <h2>4. An expense tracker with bank-statement import (CSV parsing + charts)</h2>
            <p><strong>The hard part:</strong> messy real-world data. Every bank exports a slightly different CSV. Handling that gracefully shows engineering maturity.</p>

            <h2>5. A price/availability monitor with notifications (Cron + scraping + email)</h2>
            <p><strong>The hard part:</strong> scheduling, retries, rate limits, and not getting your IP banned. Interviewers love asking "what happens when the site changes its HTML?"</p>

            <h2>6. A REST API with proper docs and tests (Any stack)</h2>
            <p><strong>The hard part:</strong> discipline. Validation, pagination, error format, OpenAPI docs, 80%+ test coverage. Companies hiring backend freshers weight this heavily.</p>

            <h2>7. A mobile app that works offline (Flutter / React Native)</h2>
            <p><strong>The hard part:</strong> local storage, sync conflicts, and background refresh. Most mobile freshers can't explain offline-first; the ones who can get hired.</p>

            <h2>What every project needs before it goes on your resume</h2>
            <table>
                <thead><tr><th>Item</th><th>Why it matters</th></tr></thead>
                <tbody>
                    <tr><td>Live URL</td><td>Recruiters click it. If it's down, the project doesn't exist.</td></tr>
                    <tr><td>README with screenshots</td><td>Read in 30 seconds. Shows communication skill.</td></tr>
                    <tr><td>Auth + database</td><td>Proves you can build something with users.</td></tr>
                    <tr><td>One "hard part" you can explain</td><td>This is the interview question. Prepare it.</td></tr>
                    <tr><td>Clean commit history</td><td>Interviewers do scroll it.</td></tr>
                </tbody>
            </table>

            <h2>How to describe them on your resume</h2>
            <p>Bad: "Built a job board using MERN stack."</p>
            <p>Good: "Built a job board (React, Node, MongoDB) with role-based editing and idempotent applications; 120 registered users, deployed on Vercel + Atlas."</p>
            <p>Numbers, stack, one technical decision, and proof it's real.</p>

            <blockquote>Finish one project this month. Then <Link to="/jobs">apply to three roles</Link> with it — you'll earn leaderboard points and, more importantly, interview practice.</blockquote>
        </>
    );
}
