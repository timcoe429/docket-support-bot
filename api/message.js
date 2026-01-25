import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getActiveConversation, createConversation, addMessage, getConversationMessages, updateConversationStatus } from '../lib/db.js';
import { getAccountContext } from '../lib/churnzero.js';
import { getClientProjectStatus, createSupportCard } from '../lib/trello.js';
import { searchKnowledgeBase } from '../lib/db.js';
import { shouldEscalate } from '../lib/escalation.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load FAQ data
const faqPath = path.join(__dirname, '..', 'knowledge-base', 'faq.json');
let faqData = [];

try {
  const faqContent = fs.readFileSync(faqPath, 'utf-8');
  faqData = JSON.parse(faqContent);
} catch (error) {
  console.error('Error loading FAQ data:', error);
  faqData = [];
}

/**
 * Find matching FAQ based on keywords
 */
function findMatchingFAQ(message) {
  const messageLower = message.toLowerCase();
  
  // Check each FAQ item
  for (const faq of faqData) {
    // Check if message contains any keywords
    if (faq.keywords && Array.isArray(faq.keywords)) {
      for (const keyword of faq.keywords) {
        if (messageLower.includes(keyword.toLowerCase())) {
          return faq;
        }
      }
    }
    
    // Also check if message contains words from the question
    const questionWords = faq.question.toLowerCase().split(/\s+/);
    const matchingWords = questionWords.filter(word => 
      word.length > 3 && messageLower.includes(word)
    );
    
    if (matchingWords.length >= 2) {
      return faq;
    }
  }
  
  return null;
}

/**
 * POST /api/message
 * Handle chat messages, return FAQ answers or placeholder responses
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Create or get conversation (using anonymous email)
    let conversation = await getActiveConversation('anonymous');
    if (!conversation) {
      conversation = await createConversation('anonymous');
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

    // Try to get context (stubbed for now)
    let churnZeroContext = null;
    let trelloContext = null;
    let knowledgeBaseResults = [];

    try {
      churnZeroContext = await getAccountContext('anonymous');
    } catch (error) {
      console.error('Error fetching ChurnZero context:', error);
    }

    try {
      trelloContext = await getClientProjectStatus('Test Account', 'anonymous');
    } catch (error) {
      console.error('Error fetching Trello context:', error);
    }

    try {
      knowledgeBaseResults = await searchKnowledgeBase(message);
    } catch (error) {
      console.error('Error searching knowledge base:', error);
    }

    // Generate response
    let botResponse = '';
    let faqMatch = null;

    if (escalationTriggered) {
      // If escalation triggered, respond with escalation message
      botResponse = "Let me get Kayla to help with this - she'll follow up with you shortly.";
    } else {
      // Check FAQ first
      faqMatch = findMatchingFAQ(message);
      
      if (faqMatch) {
        botResponse = faqMatch.answer;
      } else {
        // Placeholder response
        botResponse = "I'm looking into that. For now, this is a test response.";
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
        knowledgeBase: knowledgeBaseResults.length,
        faqMatched: faqMatch ? faqMatch.question : null
      }
    );

    // Handle escalation - create Trello card
    if (escalationTriggered) {
      await updateConversationStatus(conversation.id, 'escalated', escalationReason);

      // Get full conversation history for the card
      const conversationHistory = await getConversationMessages(conversation.id);

      try {
        const card = await createSupportCard({
          clientEmail: 'anonymous',
          conversationId: conversation.id,
          escalationReason,
          conversationHistory: conversationHistory.concat([
            { role: 'user', content: message },
            { role: 'assistant', content: botResponse }
          ]),
          churnZeroContext,
          trelloContext
        });
        console.log('Support card created:', card.id);
      } catch (error) {
        console.error('Error creating Trello card:', error);
        // Don't fail the request if card creation fails
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
