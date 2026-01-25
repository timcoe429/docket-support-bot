import express from 'express';
import { verifyEmailIsPrimaryContact } from '../integrations/churnzero.js';
import { createSession, verifySession } from '../db/supabase.js';

const router = express.Router();

/**
 * POST /api/verify
 * Verify client email against ChurnZero primary contact
 */
router.post('/', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Verify email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if email is primary contact in ChurnZero
    const verification = await verifyEmailIsPrimaryContact(email);

    if (!verification.verified) {
      return res.status(403).json({
        verified: false,
        message: 'Email not found as primary contact. Please contact support directly.'
      });
    }

    // Create verified session
    const session = await createSession(email, true);

    res.json({
      verified: true,
      sessionId: session.id,
      clientEmail: email,
      account: verification.account
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      error: 'Failed to verify email',
      message: error.message
    });
  }
});

export default router;
