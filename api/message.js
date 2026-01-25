import { getSession } from '../lib/db.js';
import { getActiveConversation, createConversation, addMessage, getConversationMessages, updateConversationStatus } from '../lib/db.js';
import { getAccountContext } from '../lib/churnzero.js';
import { getClientProjectStatus } from '../lib/trello.js';
import { generateResponse, shouldEscalate as claudeShouldEscalate } from '../lib/claude.js';
import { searchKnowledgeBase } from '../lib/db.js';
import { shouldEscalate } from '../lib/escalation.js';
import { sendEscalationEmail } from '../lib/email.js';

/**
 * POST /api/message
 * Handle chat messages, pull context, generate responses
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ error: 'Session ID and message are required' });
    }

    // Get session
    const session = await getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (!session.verified) {
      return res.status(403).json({ error: 'Session not verified' });
    }

    // Check if session expired
    if (new Date(session.expires_at) < new Date()) {
      return res.status(403).json({ error: 'Session expired. Please verify again.' });
    }

    const clientEmail = session.client_email;

    // Get or create conversation
    let conversation = await getActiveConversation(clientEmail);
    if (!conversation) {
      conversation = await createConversation(clientEmail);
    }

    // Check for escalation triggers in user message
    const escalationCheck = shouldEscalate(message);
    let escalationTriggered = false;
    let escalationReason = null;

    if (escalationCheck.shouldEscalate) {
      escalationTriggered = true;
      escalationReason = escalationCheck.reason;
    }

    // Add user message to database
    await addMessage(conversation.id, 'user', message);

    // Pull context from ChurnZero and Trello
    let churnZeroContext = null;
    let trelloContext = null;
    let knowledgeBaseResults = [];

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

    try {
      knowledgeBaseResults = await searchKnowledgeBase(message);
    } catch (error) {
      console.error('Error searching knowledge base:', error);
    }

    // Get conversation history
    const conversationHistory = await getConversationMessages(conversation.id);

    // Prepare context for Claude
    const context = {
      churnZero: churnZeroContext,
      trello: trelloContext,
      knowledgeBase: knowledgeBaseResults
    };

    // Generate response using Claude
    let botResponse = '';
    let claudeEscalation = false;

    if (escalationTriggered) {
      // If escalation triggered, respond with escalation message
      botResponse = "Let me get Kayla to help with this - she'll follow up with you shortly.";
    } else {
      try {
        const claudeResponse = await generateResponse(
          message,
          conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          context
        );

        botResponse = claudeResponse.response;
        claudeEscalation = claudeShouldEscalate(botResponse);

        if (claudeEscalation) {
          escalationTriggered = true;
          escalationReason = 'Claude detected escalation need';
        }
      } catch (error) {
        console.error('Error generating Claude response:', error);
        botResponse = "I'm having trouble processing that right now. Let me get Kayla to help with this - she'll follow up with you shortly.";
        escalationTriggered = true;
        escalationReason = 'Claude API error';
      }
    }

    // Add bot response to database
    await addMessage(
      conversation.id,
      'assistant',
      botResponse,
      {
        churnZero: churnZeroContext ? { account: churnZeroContext.account } : null,
        trello: trelloContext ? { activeProjects: trelloContext.activeProjects?.length || 0 } : null,
        knowledgeBase: knowledgeBaseResults.length
      }
    );

    // Handle escalation
    if (escalationTriggered) {
      await updateConversationStatus(conversation.id, 'escalated', escalationReason);

      // Send escalation email
      try {
        await sendEscalationEmail({
          clientEmail,
          conversationId: conversation.id,
          escalationReason,
          conversationHistory: conversationHistory.concat([{
            role: 'user',
            content: message
          }, {
            role: 'assistant',
            content: botResponse
          }]),
          churnZeroContext,
          trelloContext
        });
      } catch (error) {
        console.error('Error sending escalation email:', error);
        // Don't fail the request if email fails
      }
    }

    res.json({
      response: botResponse,
      conversationId: conversation.id,
      escalated: escalationTriggered,
      escalationReason: escalationTriggered ? escalationReason : null
    });
  } catch (error) {
    console.error('Message handling error:', error);
    res.status(500).json({
      error: 'Failed to process message',
      message: error.message
    });
  }
}
