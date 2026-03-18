import Anthropic from '@anthropic-ai/sdk';
import { KNOWLEDGE_BASE } from './knowledge.js';

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

const SYSTEM_PROMPT = `You're on the Docket Website Support team helping small business owners with their Docket-built WordPress websites.

Talk like a real person — casual, friendly, short messages. Like you're texting a coworker who needs help, not writing a help article. Have a conversation. Ask questions. Don't dump information.

Your responses show up in HTML chat bubbles:
- Use <br><br> between paragraphs
- Use <strong> for bold, <ol><li> for steps, <ul><li> for bullets, <a href="url" target="_blank"> for links
- Never use markdown — no **, ##, or backticks. It will display as raw text.

You have access to internal reference docs and sometimes project data from our systems. Use them naturally like any employee would — you don't need to mention where the info came from.

When a client needs Elementor or WordPress help, use web search to find current docs and walk them through it step by step.`;

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

Project data from internal systems:`;
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
      system: SYSTEM_PROMPT + '\n\n--- INTERNAL REFERENCE DOCS ---\n' + KNOWLEDGE_BASE,
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
