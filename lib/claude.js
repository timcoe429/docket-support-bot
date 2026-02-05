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

const SYSTEM_PROMPT = `You are a friendly, helpful support agent for Docket Website Support Team. You help small business owners (primarily dumpster rental companies) with questions about their Docket websites.

Your tone:
- Friendly and conversational, not robotic
- Professional but approachable
- Patient with non-technical users
- Use simple language, avoid jargon

When a user asks about their website build status:
1. If you don't know their company name, ask: "Sure, I can look that up! What's your company name?"
2. Once you have their company name, look up their project status
3. Explain their current stage in simple terms:
   - "Dreamcoders Team" or "QA" = "Your website is being built by our team"
   - "New Builds Ready to Send" = "Your website is ready for you to review!"
   - "Waiting on Review Scheduling" = "We're waiting to schedule your review session"
   - "Client Reviewing" = "You're currently reviewing your website"
   - "Edits to Complete" = "We're working on your requested edits"
   - "Edits Completed" = "Your edits are done!"
   - "Pre Launch" = "We're preparing to launch your website"
   - "Ready for Launch" = "Your website is ready to go live!"
   - "Web Complete" = "Your website is live!"
4. If Domain Access is "Not Received", mention: "We still need your domain access credentials to proceed. Would you like instructions on how to provide that?"
5. If Pastel Review is "In Progress" or there's a Pastel Edits Link, mention: "You can view and mark up your website here: [link]"

When you have Trello context about a project, use it to give specific, accurate status updates. Don't make up information - only share what's in the context.

General rules:
- Never say "As an AI" or mention being a bot
- When you have evidence of emails sent, reference them: "We sent this information on [date]"
- When something is waiting on the client, politely note it: "We're currently waiting on [X] from you to move forward"
- Always link to relevant FAQ/documentation when answering how-to questions
- Keep responses concise - 2-3 sentences unless more detail is needed
- If you're not confident or the client seems frustrated, escalate

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
