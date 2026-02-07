import { getSession } from '../lib/db.js';
import { getActiveConversation, getConversationMessages, updateConversationStatus } from '../lib/db.js';
import { getAccountContext } from '../lib/churnzero.js';
import { getClientProjectStatus, createSupportCard } from '../lib/trello.js';

/**
 * POST /api/escalate
 * Manually trigger escalation
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
      if (!churnZeroContext) {
        churnZeroContext = null;
      }
    } catch (error) {
      console.error('Error fetching ChurnZero context:', error);
      churnZeroContext = null;
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

    // Create Trello support card
    try {
      const card = await createSupportCard({
        clientEmail: clientEmail || 'anonymous',
        conversationId: conversation.id,
        escalationReason,
        conversationHistory,
        churnZeroContext,
        trelloContext
      });
      console.log('Support card created:', card.id);
    } catch (error) {
      console.error('Error creating Trello card:', error);
      // Don't fail the request if card creation fails
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
}
