import { Link } from 'react-router-dom';
import { useGame } from '../context/GameContext';

/**
 * The one call-to-action block that appears on every page.
 * Pairs a job-directory action with a community action so every visitor has a next step.
 */
export const Cta = ({
    eyebrow = '// YOUR NEXT MOVE',
    title = 'Post a job. Apply to one. Earn a point either way.',
    text = 'The Consistent Coders is a free job directory run by students and early-career developers. Every post and every application earns points on the public leaderboard.',
    primary = { to: '/jobs', label: 'BROWSE JOBS →' },
    secondary = { to: '/jobs/new', label: 'POST A JOB (+1 PT)' },
}) => {
    const { play } = useGame();
    return (
        <section className="cta-block" aria-labelledby="cta-title">
            <p className="mono-text cta-eyebrow">{eyebrow}</p>
            <h2 id="cta-title" className="cta-title">{title}</h2>
            <p className="cta-text">{text}</p>
            <div className="cta-actions">
                <Link to={primary.to} className="btn-primary" onClick={() => play('click')}>
                    <span className="btn-text">{primary.label}</span>
                    <div className="btn-bg"></div>
                </Link>
                <Link to={secondary.to} className="btn-ghost" onClick={() => play('click')}>{secondary.label}</Link>
            </div>
        </section>
    );
};
