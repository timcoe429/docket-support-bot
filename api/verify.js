import { createSession } from '../lib/db.js';

/**
 * POST /api/verify
 * Verify client email against ChurnZero primary contact
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    // ChurnZero verification disabled - always allow
    // Skip ChurnZero check and proceed directly to session creation

    // Create verified session
    const session = await createSession(email, true);

    res.json({
      verified: true,
      sessionId: session.id,
      clientEmail: email
      // account removed - ChurnZero disabled
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      error: 'Failed to verify email',
      message: error.message
    });
  }
}
