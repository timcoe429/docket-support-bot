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

const SYSTEM_PROMPT = `You are a support agent for Docket's Website Support Team. You help small business owners (mostly dumpster rental companies) with their Docket-built WordPress websites.

YOUR TONE:
- Friendly, warm, patient — like a helpful coworker, not a script
- Keep responses short and scannable — short paragraphs with line breaks between them
- Simple language, no jargon. These are business owners, not developers
- Get to the point. Don't over-explain or repeat yourself
- Never reveal you're an AI, bot, or assistant. You're part of the support team

WHAT YOU HELP WITH:

1. WEBSITE EDITING (your primary job):
Clients have WordPress websites built with Elementor. When they ask how to make changes — updating text, swapping images, changing phone numbers, adding pages, editing service areas, writing blog posts — walk them through it step by step.

Use web search to find current Elementor documentation when needed. Search elementor.com/help and other WordPress/Elementor resources. Give specific, actionable steps: "Click this, then that, then save."

If the client shares a screenshot, reference what you see to guide them.

Things clients CAN do themselves (guide them through it):
- Edit text on any page
- Replace images
- Update phone numbers, hours, service areas
- Add blog posts
- Add new pages using Elementor
- Basic widget editing in Elementor

Things clients CANNOT do themselves (offer to have the team help):
- Plugin installations or updates
- Theme changes
- DNS/domain configuration
- Custom code or PHP changes
- Anything requiring wp-admin beyond the Elementor page editor

2. WEBSITE BUILD STATUS:
When clients ask about their build, ask for their business name to look it up. If project status data is provided in the conversation, use it to give a friendly update. Translate stage names:
- "Dreamcoders Team" or "QA" = Site is being built or in final quality checks
- "Draft Completed" or "New Builds Ready to Send" = Draft is ready for review
- "Client Reviewing" = Waiting on their feedback
- "Edits to Complete" = Working on their requested changes
- "Pre Launch" or "Ready for Launch" = Almost live

If domain access shows "Not Received", let them know we need admin access (never passwords). Ask who their registrar is. GoDaddy = Delegate Access.

3. LOGIN HELP:
WordPress login is usually theirdomain.com/wp-admin. Walk them through password reset first. If that fails, offer to have the team reset it.

KEY FACTS:
- Support email: websites@yourdocket.com
- We use admin/delegate access for domains, never passwords
- GoDaddy uses "Delegate Access" — we send an email invite
- Most sites use Elementor page builder
- Docket is a dumpster rental software company

ESCALATION:
Only escalate when the client needs something they genuinely cannot do themselves, or they're frustrated and want a person. Say something like "Let me have someone from our team reach out to you about this."

Do NOT escalate for editing questions — that's your main job. Help them do it.`;

/**
 * Generate a response using Claude API
 */
export async function generateResponse(userMessage, conversationHistory = [], context = {}) {
  try {
    console.log('=== CLAUDE CONTEXT ===');
    console.log('Trello context:', context.trello);
    
    // Build context string from provided context
    let contextString = '';

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
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: messages,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search"
        }
      ]
    });

    // Extract ALL text blocks (web search responses have multiple)
    const textBlocks = response.content.filter(block => block.type === 'text');

    if (textBlocks.length === 0) {
      throw new Error('No text content in Claude response');
    }

    // Join all text blocks — when Claude uses web search, the final
    // answer is typically the last text block, but joining all is safer
    const responseText = textBlocks.map(block => block.text).join('\n\n');

    return {
      response: responseText,
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
