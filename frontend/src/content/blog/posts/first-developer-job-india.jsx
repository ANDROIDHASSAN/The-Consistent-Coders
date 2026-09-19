import { Link } from 'react-router-dom';

export default function Post() {
    return (
        <>
            <p>Most freshers in India apply to 200 jobs, hear back from three, and conclude the market is dead. The market is not dead. The default approach is. This guide is the approach that works in 2026, in the order that works.</p>

            <h2>1. Pick one stack and go deep</h2>
            <p>Recruiters filter by keywords, and interviewers test depth. A resume that says "Python, Java, C++, React, Angular, Flutter" signals a student who has finished six tutorials. A resume that says "React, Node.js, MongoDB — shipped three deployed apps" signals someone who can be handed a ticket on day one.</p>
            <p>Pick a stack with real hiring volume in India right now:</p>
            <table>
                <thead><tr><th>Stack</th><th>Typical fresher roles</th><th>Where it's hiring</th></tr></thead>
                <tbody>
                    <tr><td>React + Node.js</td><td>Frontend, Full-stack, SDE-1</td><td>Startups, SaaS, agencies</td></tr>
                    <tr><td>Java + Spring Boot</td><td>Backend, SDE-1</td><td>Service companies, fintech, banks</td></tr>
                    <tr><td>Python + Django/FastAPI</td><td>Backend, Data, ML-adjacent</td><td>Startups, analytics, AI products</td></tr>
                    <tr><td>Flutter / React Native</td><td>Mobile developer</td><td>Consumer apps, D2C brands</td></tr>
                </tbody>
            </table>
            <p>Spend 8–12 weeks going deep on one. You can learn a second stack after you have a salary.</p>

            <h2>2. Build three projects that look like work</h2>
            <p>A to-do app tells an interviewer nothing. A project that has users, a database, authentication, deployment and one hard problem tells them everything. Aim for three projects, each with:</p>
            <ul>
                <li>A live URL (Vercel, Render, Railway — all free tiers work)</li>
                <li>A README with screenshots, the problem it solves, and how to run it</li>
                <li>One feature you can talk about for ten minutes (a payment flow, a real-time feed, a search index, a scheduler)</li>
            </ul>
            <p>We wrote a separate list of <Link to="/blog/best-projects-for-fresher-resume">seven projects that get freshers hired</Link>. Steal from it.</p>

            <h2>3. Make your GitHub profile the resume</h2>
            <p>Recruiters and hiring managers open your GitHub before they open your PDF. Pin the three projects. Write READMEs. Commit regularly, because a green contribution graph is the cheapest credibility you will ever buy. Full checklist: <Link to="/blog/github-profile-that-gets-you-hired">the GitHub profile that gets you hired</Link>.</p>

            <h2>4. Apply where freshers actually get hired</h2>
            <p>Naukri and LinkedIn are where 10,000 people apply to one opening. The places with better odds:</p>
            <ol>
                <li><strong>Community job boards</strong> like <Link to="/jobs">the TCC job directory</Link>, where startups and members post roles that never reach the big portals, and applicant counts are in the dozens, not thousands.</li>
                <li><strong>Referrals.</strong> A referral moves you from a pile of 1,000 to a pile of 20. Use <Link to="/blog/cold-email-template-for-developer-referrals">these cold-email templates</Link>.</li>
                <li><strong>Company career pages</strong> of Series A–C startups. They hire freshers constantly and rarely list on portals.</li>
                <li><strong>Internships that convert.</strong> Read <Link to="/blog/internship-vs-full-time-fresher">internship vs full-time as a fresher</Link> before deciding.</li>
            </ol>

            <h2>5. Prepare for the interview you'll actually face</h2>
            <p>Fresher interviews in India in 2026 typically look like this:</p>
            <ul>
                <li><strong>Round 1 — Screening:</strong> a 20-minute call about your projects. Be able to explain every decision in them.</li>
                <li><strong>Round 2 — DSA:</strong> arrays, strings, hash maps, two pointers, basic trees. LeetCode Easy/Medium. Two to three problems.</li>
                <li><strong>Round 3 — Practical:</strong> build a small feature in your stack, or debug something. This is where project experience wins.</li>
                <li><strong>Round 4 — HR:</strong> salary, joining date, notice. Know your number in advance.</li>
            </ul>
            <p>Two hours a day, five days a week, for eight weeks covers this comfortably.</p>

            <h2>6. Track applications like a project</h2>
            <p>A spreadsheet with company, role, date applied, contact, status, and next step. Follow up after seven days. Most freshers never follow up; the ones who do get replies.</p>

            <h2>The timeline</h2>
            <table>
                <thead><tr><th>Weeks</th><th>Focus</th></tr></thead>
                <tbody>
                    <tr><td>1–8</td><td>One stack, deep. Project 1 shipped by week 4, project 2 by week 8.</td></tr>
                    <tr><td>9–12</td><td>Project 3, GitHub cleanup, resume, start DSA daily.</td></tr>
                    <tr><td>13–20</td><td>Apply 10/week via boards + referrals, interview, iterate.</td></tr>
                </tbody>
            </table>
            <p>Five months from zero to offer is realistic for someone who is consistent. Which is, not coincidentally, the whole point of this community.</p>

            <blockquote>Start today: <Link to="/jobs">browse the open fresher roles</Link>, or <Link to="/join">join the community</Link> and build alongside people doing the same thing.</blockquote>
        </>
    );
}
