import Anthropic from '@anthropic-ai/sdk';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  throw new Error('Anthropic API key not configured');
}

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY
});

const SYSTEM_PROMPT = `You are a support agent for Docket, helping clients who have websites managed through our platform. These are roll-off dumpster and waste management businesses.

TONE:
- Friendly but firm
- Not overly apologetic
- Professional and efficient
- Use the client's name when you have it

RULES:
- Never say "As an AI" or mention being a bot
- When you have evidence of emails sent, reference them: "We sent this information on [date]"
- When something is waiting on the client, politely note it: "We're currently waiting on [X] from you to move forward"
- Always link to relevant FAQ/documentation when answering how-to questions
- Keep responses concise - 2-3 sentences unless more detail is needed
- If you're not confident or the client seems frustrated, escalate

CONTEXT PROVIDED:
You'll receive client context including recent ChurnZero activity, Trello project status, and conversation history. Use this to give accurate, personalized responses.

ESCALATION:
If the client mentions: canceling, refunds, wants to speak to someone, uses profanity, or seems very frustrated - respond with: "Let me get Kayla to help with this - she'll follow up with you shortly." Then trigger escalation.`;

/**
 * Generate a response using Claude API
 */
export async function generateResponse(userMessage, conversationHistory = [], context = {}) {
  try {
    // Build context string from provided context
    let contextString = '';
    
    if (context.churnZero) {
      contextString += '\n\nCLIENT CONTEXT FROM CHURNZERO:\n';
      if (context.churnZero.account) {
        contextString += `Account: ${context.churnZero.account.name}\n`;
      }
      if (context.churnZero.recentEmails && context.churnZero.recentEmails.length > 0) {
        contextString += 'Recent emails sent:\n';
        context.churnZero.recentEmails.forEach(email => {
          if (email.direction === 'outbound' || email.direction === 'sent') {
            contextString += `- ${email.subject} sent on ${email.date}\n`;
          }
        });
      }
    }

    if (context.trello) {
      contextString += '\n\nPROJECT STATUS FROM TRELLO:\n';
      if (context.trello.activeProjects && context.trello.activeProjects.length > 0) {
        contextString += 'Active projects:\n';
        context.trello.activeProjects.forEach(project => {
          contextString += `- ${project.name}: ${project.status}\n`;
          if (project.checklists && project.checklists.length > 0) {
            project.checklists.forEach(checklist => {
              const incomplete = checklist.items.filter(item => !item.completed);
              if (incomplete.length > 0) {
                contextString += `  Waiting on: ${incomplete.map(i => i.name).join(', ')}\n`;
              }
            });
          }
        });
      }
    }

    if (context.knowledgeBase && context.knowledgeBase.length > 0) {
      contextString += '\n\nRELEVANT FAQ:\n';
      context.knowledgeBase.forEach(kb => {
        contextString += `Q: ${kb.question}\nA: ${kb.answer}\n\n`;
      });
    }

    // Build messages array for Claude
    const messages = [];
    
    // Add conversation history (excluding system prompt)
    conversationHistory.forEach(msg => {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      }
    });

    // Add current user message with context
    const userMessageWithContext = userMessage + (contextString ? '\n\n' + contextString : '');
    messages.push({
      role: 'user',
      content: userMessageWithContext
    });

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages
    });

    // Extract text content from response
    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent) {
      throw new Error('No text content in Claude response');
    }

    return {
      response: textContent.text,
      usage: response.usage,
      stopReason: response.stop_reason
    };
  } catch (error) {
    console.error('Error generating Claude response:', error);
    throw new Error(`Failed to generate response: ${error.message}`);
  }
}

/**
 * Check if response indicates escalation is needed
 */
export function shouldEscalate(response) {
  const escalationPhrase = "Let me get Kayla to help with this";
  return response.includes(escalationPhrase);
}
