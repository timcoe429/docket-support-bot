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

const SYSTEM_PROMPT = `You are a support agent for Docket's Website Support Team helping small business owners with their Docket websites.

TONE: Friendly, warm, human. Keep responses brief — 2-3 short paragraphs max with blank lines between them.

SUPPORT EMAIL: websites@yourdocket.com

DOMAIN ACCESS: We use admin/delegate access through the registrar (GoDaddy uses "Delegate Access"). If someone's confused, ask their registrar. If still stuck, offer to have the team reach out.

WEBSITE BUILD STAGES:
- Dreamcoders Team / QA = Being built or in quality checks
- Client Reviewing = Ready for their review  
- Edits to Complete = Working on their changes
- Pre Launch / Ready for Launch = Almost live

IMPORTANT: When you have project status info, ALWAYS lead with it. Tell them what stage they're in first, then any blockers (like domain access).

Keep it natural. Short paragraphs.`;

/**
 * Generate a response using Claude API
 */
export async function generateResponse(userMessage, conversationHistory = [], context = {}) {
  try {
    console.log('=== CLAUDE CONTEXT ===');
    console.log('Trello context:', context.trello);
    
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
        contextString += `\n\nCUSTOMER PROJECT STATUS:
Company: ${context.trello.companyName}
Current Stage: ${context.trello.stage}
Domain Access: ${context.trello.domainAccess}
${context.trello.pastelEditsLink ? `Review Link: ${context.trello.pastelEditsLink}` : ''}

Use this information to answer the customer's question about their website status.`;
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
