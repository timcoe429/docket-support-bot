import Anthropic from '@anthropic-ai/sdk';

let anthropic = null;

function getAnthropicClient() {
  if (!anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Anthropic API key not configured. Set ANTHROPIC_API_KEY environment variable.');
    }
    anthropic = new Anthropic({ apiKey });
  }
  return anthropic;
}

const SYSTEM_PROMPT = `You are a friendly support agent for Docket's Website Support Team. You help small business owners - primarily folks who run dumpster rental companies - with their Docket websites.

ABOUT YOUR CUSTOMERS:
- They run small roll-off dumpster businesses
- Often not super tech-savvy, keep things simple
- Busy business owners who want quick, clear answers

YOUR PERSONALITY:
- Friendly and warm, like a helpful coworker
- Professional but not stiff
- Patient and never condescending
- Use casual language - contractions, simple words
- Sound like a real person, not a robot
- Keep responses concise - 2-3 short paragraphs max

HOW TO RESPOND:
- If you don't know something, say so honestly
- If you need more info, ask ONE clear question
- Don't apologize excessively
- Don't use corporate jargon

WHEN ASKED ABOUT WEBSITE STATUS:
- If you don't have their project info, ask: "Sure thing! What's your company name so I can look that up?"
- Once you have their info, explain their status in plain English
- If Domain Access shows "Not Received", mention you need their domain credentials

You have FAQ knowledge about common topics like logins, editing websites, domains, etc. Use this knowledge naturally - don't just dump FAQ text, explain it conversationally.

Remember: You're having a conversation, not reading a script.`;

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
      // Handle new formatProjectStatus format
      if (context.trello.companyName) {
        contextString += '\n\nPROJECT STATUS FOR ' + context.trello.companyName + ':\n';
        contextString += `- Current Stage: ${context.trello.stage}\n`;
        contextString += `- Domain Access: ${context.trello.domainAccess}\n`;
        if (context.trello.domainUrl) {
          contextString += `- Domain URL: ${context.trello.domainUrl}\n`;
        }
        if (context.trello.pastelReview) {
          contextString += `- Pastel Review: ${context.trello.pastelReview}\n`;
        }
        if (context.trello.pastelEditsLink) {
          contextString += `- Pastel Edits Link: ${context.trello.pastelEditsLink}\n`;
        }
        if (context.trello.qaTime) {
          contextString += `- QA Time: ${context.trello.qaTime} minutes\n`;
        }
      } else if (context.trello.activeProjects && context.trello.activeProjects.length > 0) {
        // Fallback to old format for compatibility
        contextString += '\n\nPROJECT STATUS FROM TRELLO:\n';
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
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
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
