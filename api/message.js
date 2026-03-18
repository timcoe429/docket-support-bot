import { getConversation, createConversation, addMessage, getConversationMessages, updateConversationStatus, searchKnowledgeBase } from '../lib/db.js';
import { findClientCard, formatProjectStatus } from '../lib/trello.js';
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

    const incomingConversationId = req.body.conversationId || null;
    let conversation = null;

    if (incomingConversationId) {
      try {
        conversation = await getConversation(incomingConversationId);
      } catch (error) {
        console.error('Could not load conversation:', incomingConversationId);
      }
    }

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

    // Trello lookup — only when status category AND we haven't already used Trello in this conversation
    let trelloContext = null;
    const hasTrelloInHistory = previousMessages.some(msg =>
      msg.role === 'assistant' && msg.context_used && msg.context_used.trello
    );

    if (category === 'status' && !hasTrelloInHistory) {
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
      botResponse = "I've submitted your info to our Docket Websites team. Someone will follow up with you via email shortly — our support hours are Monday through Friday, 8am to 5pm EST.";
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
        botResponse = "I'm having a little trouble on my end right now. Can you try that again? If it keeps happening, shoot us an email at websites@yourdocket.com and we'll get you sorted out.";
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
