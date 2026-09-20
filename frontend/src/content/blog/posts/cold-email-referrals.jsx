import { Link } from 'react-router-dom';

export default function Post() {
    return (
        <>
            <p>A referral moves your resume from a pile of a thousand to a pile of twenty. Most freshers never ask for one because the email feels awkward. These three templates remove the awkwardness — and the notes explain why each line is there so you can adapt them.</p>

            <h2>The rules before the templates</h2>
            <ul>
                <li><strong>Ask engineers, not HR.</strong> Engineers get referral bonuses and want good teammates. HR gets 500 emails a day.</li>
                <li><strong>One specific role.</strong> Include the job link. "Any role" is a no.</li>
                <li><strong>Make it a 30-second yes.</strong> Attach nothing they have to open. One link to a deployed project, one to your resume.</li>
                <li><strong>Under 120 words.</strong> They read it on a phone between meetings.</li>
            </ul>

            <h2>Template 1 — Cold, to someone you don't know</h2>
            <pre><code>{`Subject: Referral for Frontend Intern (JD #1234)?

Hi [Name],

I'm a final-year CS student applying for the Frontend Intern role at [Company] (link). I built a job board in React/Node that has 120 users — live here: [url].

If you think I'd be a fit, would you be open to referring me? Totally fine if not — I'd appreciate any pointer on what the team looks for.

Thanks,
[Your name]
[LinkedIn] · [GitHub]`}</code></pre>
            <p><em>Why it works:</em> the role is specific, the proof is one click away, and the ask has an easy out ("fine if not"), which paradoxically makes people say yes more often.</p>

            <h2>Template 2 — Warm, you share something (college, community, event)</h2>
            <pre><code>{`Subject: Fellow [College/TCC] member — referral for [Role]?

Hi [Name],

We're both in [The Consistent Coders / college name] — I saw your post about [thing]. I'm applying for [Role] at [Company] (link) and thought I'd ask before submitting cold.

Quick proof I can do the job: [project, one line, url].

Could you refer me, or tell me who on the team I should talk to?

[Your name]`}</code></pre>
            <p><em>Why it works:</em> a shared identity is the strongest trigger for referrals. Mention it in the subject line so it's seen before the email is opened.</p>

            <h2>Template 3 — Follow-up (send after 5–7 days, once)</h2>
            <pre><code>{`Subject: Re: Referral for [Role]?

Hi [Name] — bumping this in case it got buried. The role closes on [date]. If a referral isn't possible, no worries at all; I'll apply directly.

[Your name]`}</code></pre>
            <p><em>Why it works:</em> a deadline gives them a reason to act now, and "no worries" keeps the door open for next time.</p>

            <h2>What gets you ignored</h2>
            <table>
                <thead><tr><th>Mistake</th><th>Fix</th></tr></thead>
                <tbody>
                    <tr><td>"Sir/Madam, I am seeking opportunity…"</td><td>Use their first name; write like a colleague.</td></tr>
                    <tr><td>Resume attached as PDF</td><td>Link it. Attachments from strangers get skipped.</td></tr>
                    <tr><td>Asking for "any opening"</td><td>One role, one link.</td></tr>
                    <tr><td>Three paragraphs about your passion</td><td>One line of proof beats three of passion.</td></tr>
                    <tr><td>Following up daily</td><td>Once, after a week.</td></tr>
                </tbody>
            </table>

            <blockquote>Find a role worth a referral in <Link to="/jobs">the job directory</Link>, then send Template 1 tonight. Applying there earns you a point too.</blockquote>
        </>
    );
}
