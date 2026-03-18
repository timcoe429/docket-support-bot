import { getActiveConversation, createConversation, addMessage, getConversationMessages, updateConversationStatus } from '../lib/db.js';
import { findClientCard, formatProjectStatus } from '../lib/trello.js';
import { searchKnowledgeBase } from '../lib/db.js';
import { shouldEscalate } from '../lib/escalation.js';
import { generateResponse } from '../lib/claude.js';
import { sendSlackEscalation } from '../lib/slack.js';

/**
 * POST /api/message
 * Handle chat messages, return FAQ answers or placeholder responses
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, conversationId, category } = req.body;

    console.log('=== REQUEST DEBUG ===');
    console.log('Message:', message);
    console.log('Category:', category);

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Create or get conversation (using anonymous email)
    let conversation = await getActiveConversation('anonymous');
    if (!conversation) {
      conversation = await createConversation('anonymous');
    }

    // Only auto-escalate for explicit human requests
    const escalationCheck = shouldEscalate(message);
    let escalationTriggered = false;
    let escalationReason = null;

    if (escalationCheck.shouldEscalate && escalationCheck.reason === 'Explicit request for human agent') {
      escalationTriggered = true;
      escalationReason = escalationCheck.reason;
    }

    // Add user message to database
    await addMessage(conversation.id, 'user', message);

    // Get conversation history for checking recent messages and for Claude
    const previousMessages = await getConversationMessages(conversation.id);
    const history = previousMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Trello lookup — try if status category selected
    let trelloContext = null;

    if (category === 'status') {
      // Always try lookup for status category
      try {
        const cardData = await findClientCard(message);
        if (cardData) {
          trelloContext = formatProjectStatus(cardData);
        }

        // If no match on current message, check recent messages for company name
        if (!trelloContext && history.length > 0) {
          for (const msg of history.slice(-6)) {
            if (msg.role === 'user') {
              const cardData = await findClientCard(msg.content);
              if (cardData) {
                trelloContext = formatProjectStatus(cardData);
                break;
              }
            }
          }
        }
      } catch (error) {
        console.error('Trello lookup error:', error);
      }
    }

    let knowledgeBaseResults = [];
    try {
      knowledgeBaseResults = await searchKnowledgeBase(message);
    } catch (error) {
      console.error('Error searching knowledge base:', error);
    }

    // Build context object for Claude
    const context = {
      trello: trelloContext || null,
      knowledgeBase: knowledgeBaseResults || []
    };

    // Generate response
    let botResponse = '';

    if (escalationTriggered) {
      // If escalation triggered, respond with escalation message
      botResponse = "Let me get Kayla to help with this - she'll follow up with you shortly.";
    } else {
      // Always call Claude to generate AI response
      try {
        const claudeResponse = await generateResponse(
          message, // current user message
          history, // previous messages (already formatted)
          context // Trello, KB context
        );
        botResponse = claudeResponse.response; // Note: Claude returns {response, usage, stopReason}
      } catch (error) {
        console.error('Claude API error:', error);
        // Fallback: friendly message and trigger escalation
        botResponse = "I'm having trouble connecting right now. Let me create a support ticket so our team can help you directly.";
        escalationTriggered = true;
        escalationReason = 'Claude API error: ' + error.message;
      }
    }

    // Add bot response to database
    await addMessage(
      conversation.id,
      'assistant',
      botResponse,
      {
        trello: trelloContext ? true : false,
        knowledgeBase: knowledgeBaseResults.length
      }
    );

    // Handle escalation - Slack only (no Trello card)
    if (escalationTriggered) {
      await updateConversationStatus(conversation.id, 'escalated', escalationReason);

      // Notify Slack (no Trello card — Slack is the notification)
      try {
        const fullHistory = await getConversationMessages(conversation.id);
        const recentMessages = fullHistory.slice(-6);
        const summary = recentMessages
          .map(msg => `${msg.role === 'user' ? 'Client' : 'Agent'}: ${msg.content.substring(0, 150)}`)
          .join('\n');

        await sendSlackEscalation({
          clientName: trelloContext?.companyName || 'Unknown client',
          issue: escalationReason,
          chatSummary: summary,
          trelloCardUrl: null
        });
        console.log('Slack escalation sent');
      } catch (error) {
        console.error('Error sending Slack notification:', error);
      }
    }

    // Debug: log raw response to check formatting
    console.log('=== RAW BOT RESPONSE ===');
    console.log(botResponse.substring(0, 500));
    console.log('=== END RAW RESPONSE ===');

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
