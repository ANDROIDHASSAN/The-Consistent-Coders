import { Link } from 'react-router-dom';

export default function Post() {
    return (
        <>
            <p>You have two offers, or you're deciding what to apply for: a ₹15K/month internship at a startup you like, or a ₹3.5 LPA full-time role at a service company. Which one? It depends on exactly three things.</p>

            <h2>The three questions</h2>
            <h3>1. Will you write production code?</h3>
            <p>An internship where you ship features to real users beats a full-time job where you sit on the bench for six months. Ask directly: "What will I ship in my first month?" A vague answer is your answer.</p>
            <h3>2. Does it convert?</h3>
            <p>Ask for the conversion rate. "Roughly how many of last year's interns got full-time offers?" Above 50% is a real pipeline. Below 20% is cheap labour.</p>
            <h3>3. Can you afford it?</h3>
            <p>Be honest. If a stipend means borrowing money for rent, take the full-time role, build projects on weekends, and switch in twelve months. Financial stress kills learning.</p>

            <h2>Side-by-side</h2>
            <table>
                <thead><tr><th></th><th>Internship (good one)</th><th>Full-time (typical fresher)</th></tr></thead>
                <tbody>
                    <tr><td>Money now</td><td>₹10–40K/month</td><td>₹3–6 LPA</td></tr>
                    <tr><td>Learning speed</td><td>High at startups</td><td>Varies wildly; often slow at large service cos</td></tr>
                    <tr><td>Risk</td><td>May not convert</td><td>Bond/notice periods, may be benched</td></tr>
                    <tr><td>Resume signal</td><td>Strong if you shipped</td><td>Strong if the company is known</td></tr>
                    <tr><td>Best for</td><td>Students with a runway</td><td>Freshers who need income now</td></tr>
                </tbody>
            </table>

            <h2>How to convert an internship into a job</h2>
            <ol>
                <li><strong>Ship something visible in week one.</strong> A bug fix, a small feature, anything that touches production.</li>
                <li><strong>Write things down.</strong> Docs, runbooks, PR descriptions. Interns who make the team's life easier get kept.</li>
                <li><strong>Ask for the conversation at week eight.</strong> "I'd like to stay on. What would I need to show by the end?" Then show it.</li>
            </ol>

            <h2>The trap to avoid</h2>
            <p>Unpaid internships with "certificate" as compensation, and full-time roles with 2-year bonds. Both are red flags in 2026. There are enough <Link to="/jobs?type=Internship">paid internships</Link> that you never need to work for free.</p>

            <blockquote>Still deciding? Filter the directory by <Link to="/jobs?type=Internship">internships</Link> or <Link to="/jobs?experience=Fresher">fresher full-time roles</Link> and compare what's actually out there this week.</blockquote>
        </>
    );
}
