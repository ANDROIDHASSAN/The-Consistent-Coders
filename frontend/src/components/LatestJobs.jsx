import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useGame } from '../context/GameContext';

/** Six newest open jobs, as a crawlable table. Used on the home page. */
export const LatestJobs = () => {
    const { play } = useGame();
    const [jobs, setJobs] = useState(null);
    const [error, setError] = useState('');
    useEffect(() => {
        apiFetch('/jobs?limit=6').then((res) => setJobs(res.items)).catch((err) => { setError(err.message); setJobs([]); });
    }, []);

    return (
        <section className="container" style={{ padding: 'var(--section-pad) 0 0' }} aria-labelledby="latest-jobs">
            <p className="page-eyebrow mono-text">// LIVE DIRECTORY</p>
            <h2 id="latest-jobs" className="h2">Newest jobs &amp; internships</h2>
            <p className="page-lede" style={{ marginBottom: '1.5rem' }}>Posted by members, startups and recruiters. Free to post, free to apply, and every action earns a point.</p>
            {error && <p className="form-error" role="alert">{error}</p>}
            {jobs === null ? (
                <div className="skeleton" />
            ) : jobs.length === 0 ? (
                <div className="empty">
                    <p>The board is empty right now — which means the first post gets all the attention.</p>
                    <p style={{ marginTop: '1rem' }}><Link to="/jobs/new" className="btn-ghost" onClick={() => play('click')}>Post the first job (+1 pt)</Link></p>
                </div>
            ) : (
                <div className="table-wrap">
                    <table className="table">
                        <thead><tr><th>Role</th><th>Company</th><th>Type</th><th>Mode</th><th>Location</th><th>Salary</th></tr></thead>
                        <tbody>
                            {jobs.map((j) => (
                                <tr key={j.id}>
                                    <td><Link to={`/jobs/${j.slug}`} onClick={() => play('click')}>{j.title}</Link></td>
                                    <td>{j.company}</td>
                                    <td>{j.type}</td>
                                    <td>{j.workMode}</td>
                                    <td>{j.location}</td>
                                    <td>{j.salary || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
                <Link to="/jobs" className="btn-primary" onClick={() => play('click')}><span className="btn-text">ALL JOBS →</span><div className="btn-bg"></div></Link>
                <Link to="/jobs/new" className="btn-ghost" onClick={() => play('click')}>POST A JOB (+1 PT)</Link>
            </div>
        </section>
    );
};
