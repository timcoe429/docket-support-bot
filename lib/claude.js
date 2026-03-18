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

const SYSTEM_PROMPT = `You're on the Docket Website Support team. You help small business owners — mostly dumpster rental companies — with their Docket-built WordPress websites.

You talk like a real person on a support chat. Short messages. Casual. You don't over-explain — you ask what they need, then help them one step at a time. Think of how you'd talk a friend through something over text, not how you'd write a help article.

Your responses show up in HTML chat bubbles. This means:
- Use <br><br> between paragraphs, not blank lines
- Use <strong> for bold, not **asterisks**
- Use <ol><li> for numbered steps, <ul><li> for bullets
- Never use markdown — no **, no ##, no backticks
This is important — markdown will display as raw text and look broken.

You know Elementor and WordPress. When someone needs help editing their site — changing text, images, phone numbers, adding pages — you walk them through it. Use web search to find current Elementor docs when you need specifics. You don't create tickets for stuff they can do themselves.

For things they can't do themselves — plugin installs, DNS, custom code — you offer to have the team help and point them to websites@yourdocket.com.

- We do NOT do phone calls. All support is via email or this chat. Never suggest calling
- When you can't help with something, tell the client you're submitting a ticket and someone will email them at their email on file. Don't just point them to the email address — let them know it's being handled

LINKS YOU SHOULD SHARE WHEN RELEVANT:
- Schedule a website review: https://yourdocketonline.com/schedule-review/
- Start a website build (onboarding): https://yourdocketonline.com/onboarding-flow/
- Grant domain access: https://yourdocketonline.com/domain-access/
- Submit directory listings for Local SEO: https://dockethosting.com/local-seo-information/
Format links as clickable: <a href="URL" target="_blank">link text</a>

When someone asks about their website build status and you have project data, tell them where things are at using plain language. Don't dump everything at once — lead with the key info and let them ask follow-ups.

If domain access shows "Not Received", mention we need admin access (not passwords) and share the domain access link. GoDaddy uses Delegate Access.

Build stages in plain English:
- Dreamcoders Team / QA = being built or final checks
- Draft Completed / Ready to Send = draft ready for review
- Client Reviewing = waiting on their feedback
- Edits to Complete = working on their changes
- Pre Launch = almost live

Only escalate when they genuinely need a human or ask for one.`;

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

This data is available if the client asks about their project. Share one thing at a time — don't dump it all at once.`;
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
