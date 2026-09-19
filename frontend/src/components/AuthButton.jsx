import { Link } from 'react-router-dom';
import { SignInButton, UserButton } from '@clerk/react';
import { CLERK_ENABLED, useSession } from '../lib/auth';
import { useGame } from '../context/GameContext';

/**
 * Sign-in / account control. Uses Clerk's modal sign-in (Google + email out of the box).
 * When signed in, shows the member's points next to their avatar so the score is always visible.
 */
export const AuthButton = ({ onNavigate, className = '' }) => {
    const { isSignedIn, isLoaded } = useSession();
    const { me, play, toast } = useGame();

    if (!CLERK_ENABLED) {
        return (
            <button type="button" className={`btn-ghost auth-signin ${className}`} onClick={() => toast('Sign-in is not configured yet (VITE_CLERK_PUBLISHABLE_KEY missing).', { kind: 'info', sound: 'error' })}>
                SIGN IN
            </button>
        );
    }
    if (!isLoaded) return <span className={`auth-loading ${className}`} aria-hidden="true" />;

    if (isSignedIn) {
        return (
            <div className={`auth-signed-in ${className}`}>
                <Link to="/profile" className="auth-score mono-text" onClick={() => { play('click'); onNavigate?.(); }} title="Your dashboard">
                    <span className="auth-score-value">{me?.user?.points ?? 0}</span>
                    <span className="auth-score-label">PTS · {me?.user?.rank?.name ?? 'Rookie'}</span>
                </Link>
                <UserButton appearance={{ elements: { avatarBox: { width: 36, height: 36 } } }}>
                    <UserButton.MenuItems>
                        <UserButton.Link label="My dashboard" href="/profile" labelIcon={<span>⚡</span>} />
                        <UserButton.Link label="Post a job" href="/jobs/new" labelIcon={<span>+</span>} />
                    </UserButton.MenuItems>
                </UserButton>
            </div>
        );
    }

    return (
        <SignInButton mode="modal">
            <button type="button" className={`btn-ghost auth-signin ${className}`} onClick={() => play('click')}>
                SIGN IN
            </button>
        </SignInButton>
    );
};
