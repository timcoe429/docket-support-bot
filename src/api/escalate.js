import express from 'express';
import { getSession } from '../db/supabase.js';
import { getActiveConversation, getConversationMessages, updateConversationStatus } from '../db/supabase.js';
import { getAccountContext } from '../integrations/churnzero.js';
import { getClientProjectStatus } from '../integrations/trello.js';
import { sendEscalationEmail } from '../integrations/email.js';

const router = express.Router();

/**
 * POST /api/escalate
 * Manually trigger escalation
 */
router.post('/', async (req, res) => {
  try {
    const { sessionId, reason } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Get session
    const session = await getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (!session.verified) {
      return res.status(403).json({ error: 'Session not verified' });
    }

    const clientEmail = session.client_email;

    // Get active conversation
    const conversation = await getActiveConversation(clientEmail);
    
    if (!conversation) {
      return res.status(404).json({ error: 'No active conversation found' });
    }

    // Get conversation history
    const conversationHistory = await getConversationMessages(conversation.id);

    // Pull context
    let churnZeroContext = null;
    let trelloContext = null;

    try {
      churnZeroContext = await getAccountContext(clientEmail);
    } catch (error) {
      console.error('Error fetching ChurnZero context:', error);
    }

    try {
      const accountName = churnZeroContext?.account?.name || clientEmail;
      trelloContext = await getClientProjectStatus(accountName, clientEmail);
    } catch (error) {
      console.error('Error fetching Trello context:', error);
    }

    // Update conversation status
    const escalationReason = reason || 'Manual escalation requested';
    await updateConversationStatus(conversation.id, 'escalated', escalationReason);

    // Send escalation email
    try {
      await sendEscalationEmail({
        clientEmail,
        conversationId: conversation.id,
        escalationReason,
        conversationHistory,
        churnZeroContext,
        trelloContext
      });
    } catch (error) {
      console.error('Error sending escalation email:', error);
      return res.status(500).json({
        error: 'Failed to send escalation email',
        message: error.message
      });
    }

    res.json({
      success: true,
      message: 'Escalation triggered successfully',
      conversationId: conversation.id
    });
  } catch (error) {
    console.error('Escalation error:', error);
    res.status(500).json({
      error: 'Failed to escalate',
      message: error.message
    });
  }
});

export default router;
