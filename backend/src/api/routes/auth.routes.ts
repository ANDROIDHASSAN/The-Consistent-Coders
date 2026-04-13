import { Router, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Verify Google token
    const ticket: any = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID as string,
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists
    let user = await User.findOne({ googleId });
    
    if (!user) {
      // Create new user
      user = new User({
        googleId,
        email,
        name,
        picture,
      });
      await user.save();
    } else {
      // Update info if changed
      let changed = false;
      if (user.name !== name) { user.name = name!; changed = true; }
      if (user.picture !== picture) { user.picture = picture!; changed = true; }
      if (changed) await user.save();
    }

    // Create our own JWT Session token
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_please_change';
    const sessionToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Authentication successful',
      token: sessionToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
});

export default router;
