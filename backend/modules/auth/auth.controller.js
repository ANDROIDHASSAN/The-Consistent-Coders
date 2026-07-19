import { OAuth2Client } from 'google-auth-library';
import { env } from '../../config/env.js';
import { User } from '../profile/profile.model.js';
import { signAccessToken, verifyGoogleCredential } from './auth.service.js';

// ---------------------------------------------------------------------------
// Existing endpoints (unchanged)
// ---------------------------------------------------------------------------

export const getGoogleAuthConfig = (req, res) => {
    if (!env.googleClientId) {
        res.status(500).json({
            success: false,
            message: 'Google auth is not configured on server.',
        });
        return;
    }

    res.status(200).json({
        success: true,
        clientId: env.googleClientId,
    });
};

export const googleSignIn = async (req, res, next) => {
    try {
        const { credential } = req.body ?? {};

        if (!credential) {
            res.status(400).json({
                success: false,
                message: 'Missing Google credential.',
            });
            return;
        }

        if (!env.googleClientId) {
            res.status(500).json({
                success: false,
                message: 'Google auth is not configured on server.',
            });
            return;
        }

        const profile = await verifyGoogleCredential(credential, env.googleClientId);
        const user = await User.findOneAndUpdate(
            { googleId: profile.id },
            {
                $set: {
                    email: profile.email,
                    name: profile.name || profile.email.split('@')[0],
                    picture: profile.picture || '',
                    emailVerified: profile.emailVerified,
                },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true },
        ).lean();

        const token = signAccessToken(user._id);
        res.status(200).json({
            success: true,
            token,
            user: {
                id: String(user._id),
                email: user.email,
                name: user.name,
                picture: user.picture,
                emailVerified: user.emailVerified,
            },
        });
    }
    catch (error) {
        next(error);
    }
};

// ---------------------------------------------------------------------------
// New: Server-side OAuth 2.0 redirect flow
// Bypasses the GSI JavaScript library entirely, so there is no client-side
// origin check that can fail with "origin is not allowed".
// ---------------------------------------------------------------------------

/**
 * Build the redirect URI that Google will call back to.
 * We are using port 5000 here because that is exactly what is registered
 * in the Google Cloud Console (Authorized redirect URIs).
 * In production this should be your backend's deployed domain.
 */
const getRedirectUri = () => {
    return env.callbackUrl || `http://localhost:5000/api/auth/google/callback`;
};

/**
 * GET /api/auth/google/redirect
 * Redirects the user (or a popup) to Google's consent screen.
 */
export const googleOAuthRedirect = (req, res) => {
    if (!env.googleClientId || !env.googleClientSecret) {
        res.status(500).json({
            success: false,
            message: 'Google OAuth is not configured on server.',
        });
        return;
    }

    const redirectUri = getRedirectUri();

    const client = new OAuth2Client(
        env.googleClientId,
        env.googleClientSecret,
        redirectUri,
    );

    const authorizeUrl = client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
        ],
        prompt: 'select_account',
    });

    res.redirect(authorizeUrl);
};

/**
 * GET /api/auth/google/callback
 * Google redirects here with ?code=...
 * We exchange the code for tokens, upsert the user, create a JWT,
 * and return a small HTML page that posts the result to the opener window.
 */
export const googleOAuthCallback = async (req, res, next) => {
    try {
        const { code } = req.query;

        if (!code) {
            res.status(400).send(buildCallbackHtml({ error: 'Missing authorization code.' }));
            return;
        }

        const redirectUri = getRedirectUri();

        const client = new OAuth2Client(
            env.googleClientId,
            env.googleClientSecret,
            redirectUri,
        );

        // Exchange code for tokens
        const { tokens } = await client.getToken(code);
        client.setCredentials(tokens);

        // Verify the id_token to get user info
        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: env.googleClientId,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.sub || !payload.email) {
            res.status(400).send(buildCallbackHtml({ error: 'Invalid Google token payload.' }));
            return;
        }

        // Upsert user
        const user = await User.findOneAndUpdate(
            { googleId: payload.sub },
            {
                $set: {
                    email: payload.email,
                    name: payload.name || payload.email.split('@')[0],
                    picture: payload.picture || '',
                    emailVerified: Boolean(payload.email_verified),
                },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true },
        ).lean();

        const jwtToken = signAccessToken(user._id);

        // Return HTML that sends the result to the opener (popup flow)
        res.status(200).send(buildCallbackHtml({
            token: jwtToken,
            user: {
                id: String(user._id),
                email: user.email,
                name: user.name,
                picture: user.picture,
                emailVerified: user.emailVerified,
            },
        }));
    }
    catch (error) {
        console.error('Google OAuth callback error:', error);
        res.status(500).send(buildCallbackHtml({ error: 'Google sign-in failed. Please try again.' }));
    }
};

/**
 * Builds a minimal HTML page that communicates back to the opener window
 * via postMessage, then closes itself. Works for both popup and redirect flows.
 */
function buildCallbackHtml(data) {
    const payload = JSON.stringify(data);
    return `<!DOCTYPE html>
<html>
<head><title>Signing in…</title></head>
<body>
<p>Signing in… this window will close automatically.</p>
<script>
(function() {
    var data = ${payload};
    if (window.opener) {
        window.opener.postMessage({ type: 'GOOGLE_AUTH_RESULT', payload: data }, '*');
        window.close();
    } else {
        // Fallback: redirect to frontend with token in hash
        var params = new URLSearchParams();
        if (data.token) params.set('token', data.token);
        if (data.user) params.set('user', encodeURIComponent(JSON.stringify(data.user)));
        if (data.error) params.set('auth_error', data.error);
        window.location.href = '/' + '?' + params.toString();
    }
})();
</script>
</body>
</html>`;
}
