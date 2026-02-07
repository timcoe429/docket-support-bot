import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getActiveConversation, createConversation, addMessage, getConversationMessages, updateConversationStatus } from '../lib/db.js';
import { getAccountContext } from '../lib/churnzero.js';
import { getClientProjectStatus, createSupportCard, findClientCard, formatProjectStatus } from '../lib/trello.js';
import { searchKnowledgeBase } from '../lib/db.js';
import { shouldEscalate } from '../lib/escalation.js';
import { generateResponse } from '../lib/claude.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load FAQ data
const faqPath = path.join(process.cwd(), 'public', 'faq.json');
let faqData = { categories: [] };

try {
  const faqContent = fs.readFileSync(faqPath, 'utf-8');
  faqData = JSON.parse(faqContent);
} catch (error) {
  console.error('Error loading FAQ data:', error);
  faqData = { categories: [] };
}

/**
 * Extract company name from message (simple heuristic)
 */
function extractCompanyName(message) {
  // Simple extraction - if message is short and doesn't contain question words,
  // it might be a company name response
  const questionWords = ['what', 'where', 'when', 'how', 'why', 'is', 'are', 'can', 'do', 'does'];
  const lowerMessage = message.toLowerCase().trim();
  
  // If it's a short message (1-5 words) without question words, might be a company name
  const words = lowerMessage.split(/\s+/);
  if (words.length <= 5 && !questionWords.some(qw => lowerMessage.startsWith(qw))) {
    return message.trim();
  }
  
  return null;
}

/**
 * Find matching FAQ based on keywords and question text
 * Searches through nested category structure
 */
function findMatchingFAQ(message) {
  const messageLower = message.toLowerCase();
  const messageWords = messageLower.split(/\s+/).filter(word => word.length > 2);
  
  let bestMatch = null;
  let bestScore = 0;
  
  // Iterate through all categories
  if (!faqData.categories || !Array.isArray(faqData.categories)) {
    return null;
  }
  
  for (const category of faqData.categories) {
    if (!category.items || !Array.isArray(category.items)) {
      continue;
    }
    
    // Check each FAQ item in the category
    for (const item of category.items) {
      let score = 0;
      
      // Check keywords
      if (item.keywords && Array.isArray(item.keywords)) {
        for (const keyword of item.keywords) {
          const keywordLower = keyword.toLowerCase();
          if (messageLower.includes(keywordLower)) {
            score += 2; // Keywords are weighted higher
          }
        }
      }
      
      // Check question text
      const questionLower = item.question.toLowerCase();
      const questionWords = questionLower.split(/\s+/).filter(word => word.length > 2);
      
      // Count matching words
      const matchingWords = questionWords.filter(qWord => 
        messageWords.some(mWord => qWord.includes(mWord) || mWord.includes(qWord))
      );
      
      score += matchingWords.length;
      
      // Exact phrase match gets bonus
      if (messageLower.includes(questionLower) || questionLower.includes(messageLower)) {
        score += 5;
      }
      
      // Update best match if this score is higher
      if (score > bestScore) {
        bestScore = score;
        bestMatch = {
          ...item,
          category: category.name,
          categoryId: category.id
        };
      }
    }
  }
  
  // Return match if score is at least 2 (meaningful match)
  return bestScore >= 2 ? bestMatch : null;
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

    // Get conversation history for checking recent messages and for Claude
    const previousMessages = await getConversationMessages(conversation.id);
    const history = previousMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Check if this message or recent conversation is about project status
    let trelloContext = null;

    // If user selected "status" category, always try Trello lookup with their message
    if (category === 'status') {
        console.log('Status category detected, attempting Trello lookup for:', message);
        try {
            const cardData = await findClientCard(message);
            console.log('Trello card data:', cardData);
            if (cardData) {
                trelloContext = formatProjectStatus(cardData);
                console.log('Formatted Trello context:', trelloContext);
            } else {
                console.log('No card found for:', message);
            }
        } catch (error) {
            console.error('Trello lookup error:', error);
        }
    }

    const statusKeywords = ['where', 'status', 'progress', 'update', 'my website', 'my site', 'how long', 'when will', 'waiting'];
    const currentMessageAsksStatus = statusKeywords.some(kw => message.toLowerCase().includes(kw));

    // Check if recent messages asked about status (user might be providing company name as follow-up)
    const recentAskedStatus = history.slice(-4).some(msg => 
        msg.role === 'user' && statusKeywords.some(kw => msg.content.toLowerCase().includes(kw))
    );

    // Also check if this looks like a company name (short message, no question words)
    const looksLikeCompanyName = message.split(/\s+/).length <= 5 && 
        !['what', 'where', 'when', 'how', 'why', 'is', 'are', 'can', 'do', 'does', 'will'].some(qw => 
            message.toLowerCase().startsWith(qw)
        );

    // Try Trello lookup if: asking about status OR recent convo asked about status and this looks like a company name
    if (currentMessageAsksStatus || (recentAskedStatus && looksLikeCompanyName)) {
        try {
            // Try the current message as a company name
            let cardData = await findClientCard(message);
            
            // If not found and we have history, try recent messages
            if (!cardData && history.length > 0) {
                for (const msg of history.slice(-4)) {
                    if (msg.role === 'user') {
                        cardData = await findClientCard(msg.content);
                        if (cardData) break;
                    }
                }
            }
            
            if (cardData) {
                trelloContext = formatProjectStatus(cardData);
            }
        } catch (error) {
            console.error('Error fetching Trello context:', error);
        }
    }

    // Try to get context
    let churnZeroContext = null;
    let knowledgeBaseResults = [];

    try {
      churnZeroContext = await getAccountContext('anonymous');
      if (!churnZeroContext) {
        churnZeroContext = null; // Explicitly set to null if function returns null
      }
    } catch (error) {
      console.error('Error fetching ChurnZero context:', error);
      churnZeroContext = null;
    }

    try {
      knowledgeBaseResults = await searchKnowledgeBase(message);
    } catch (error) {
      console.error('Error searching knowledge base:', error);
    }

    // Build context object for Claude
    const context = {
      churnZero: churnZeroContext || null,
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
          context // ChurnZero, Trello, KB context
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
        churnZero: churnZeroContext ? { account: churnZeroContext.account } : null,
        trello: trelloContext ? { activeProjects: trelloContext.activeProjects?.length || 0 } : null,
        knowledgeBase: knowledgeBaseResults.length
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
