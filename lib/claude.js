import Anthropic from '@anthropic-ai/sdk';
import { KNOWLEDGE_BASE } from './knowledge.js';
import { findClientCard, formatProjectStatus } from './trello.js';
import { sendSlackEscalation } from './slack.js';

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

// Tools that Claude can choose to call
const TOOLS = [
    {
        type: "web_search_20250305",
        name: "web_search"
    },
    {
        name: "lookup_project",
        description: "Look up a client's website build status by their business name. Only use this when a client specifically asks about the status of their website BUILD — not for login help, editing help, or general questions. Returns current build stage, domain access status, and other project details. Note: only shows websites currently in the build pipeline. If no result is found, the site is likely already launched.",
        input_schema: {
            type: "object",
            properties: {
                company_name: {
                    type: "string",
                    description: "The client's business or company name to search for"
                }
            },
            required: ["company_name"]
        }
    },
    {
        name: "escalate_to_team",
        description: "Notify the Docket Websites team that a client needs human help. Use this when the issue genuinely requires a team member (plugin installs, DNS, custom code, etc.) or when the client explicitly asks to talk to a person. This sends a Slack notification to the team with the conversation context.",
        input_schema: {
            type: "object",
            properties: {
                reason: {
                    type: "string",
                    description: "Brief description of why this needs human attention"
                },
                client_name: {
                    type: "string",
                    description: "The client's business name if known, otherwise 'Unknown'"
                }
            },
            required: ["reason"]
        }
    }
];

/**
 * Execute a tool call from Claude
 */
async function executeTool(toolName, toolInput, conversationContext) {
    switch (toolName) {
        case 'lookup_project': {
            try {
                const cardData = await findClientCard(toolInput.company_name);
                if (cardData) {
                    const status = formatProjectStatus(cardData);
                    return JSON.stringify(status);
                } else {
                    return JSON.stringify({ result: "No project found matching that business name. The name might be slightly different in our system." });
                }
            } catch (error) {
                console.error('Trello lookup error:', error);
                return JSON.stringify({ error: "Could not look up project at this time" });
            }
        }

        case 'escalate_to_team': {
            try {
                await sendSlackEscalation({
                    clientName: toolInput.client_name || 'Unknown client',
                    issue: toolInput.reason,
                    chatSummary: conversationContext.summary || 'No summary available',
                    trelloCardUrl: null
                });
                return JSON.stringify({ success: true, message: "Team has been notified via Slack" });
            } catch (error) {
                console.error('Escalation error:', error);
                return JSON.stringify({ error: "Could not notify team, but the client should email websites@yourdocket.com" });
            }
        }

        default:
            return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
}

/**
 * Generate a response using Claude API with tools
 */
export async function generateResponse(userMessage, conversationHistory = [], context = {}) {
    try {
        const client = getAnthropicClient();

        // Build the system prompt with knowledge base
        const fullSystemPrompt = SYSTEM_PROMPT + '\n\n--- INTERNAL REFERENCE DOCS ---\n' + KNOWLEDGE_BASE;

        // Build messages array from conversation history
        const messages = [];

        conversationHistory.forEach(msg => {
            if (msg.role === 'user' || msg.role === 'assistant') {
                messages.push({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.content
                });
            }
        });

        // Add current user message (no context injection — Claude uses tools instead)
        messages.push({ role: 'user', content: userMessage });

        // Build conversation summary for escalation tool (last 6 messages)
        const recentHistory = conversationHistory.slice(-6);
        const conversationSummary = recentHistory
            .map(msg => `${msg.role === 'user' ? 'Client' : 'Agent'}: ${msg.content.substring(0, 150)}`)
            .join('\n');

        // Call Claude API — loop to handle tool use
        let response = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2048,
            system: fullSystemPrompt,
            messages: messages,
            tools: TOOLS
        });

        let escalationTriggered = false;

        // Tool use loop — Claude may call tools, we execute and return results
        while (response.stop_reason === 'tool_use') {
            // Find all tool_use blocks in the response
            const toolUseBlocks = response.content.filter(block => block.type === 'tool_use');

            // Add Claude's response (with tool calls) to messages
            messages.push({ role: 'assistant', content: response.content });

            // Execute each tool and build results
            const toolResults = [];
            for (const toolUse of toolUseBlocks) {
                // Skip web_search — the API handles that server-side
                if (toolUse.name === 'web_search') continue;

                console.log(`Tool called: ${toolUse.name}`, toolUse.input);

                const result = await executeTool(toolUse.name, toolUse.input, {
                    summary: conversationSummary + `\nClient: ${userMessage}`
                });

                // Track if escalation happened
                if (toolUse.name === 'escalate_to_team') {
                    escalationTriggered = true;
                }

                toolResults.push({
                    type: 'tool_result',
                    tool_use_id: toolUse.id,
                    content: result
                });
            }

            // If we have tool results, send them back to Claude
            if (toolResults.length > 0) {
                messages.push({ role: 'user', content: toolResults });

                // Get Claude's next response
                response = await client.messages.create({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 2048,
                    system: fullSystemPrompt,
                    messages: messages,
                    tools: TOOLS
                });
            } else {
                // Only web_search tool uses — break and use current response
                break;
            }
        }

        // Extract all text blocks from final response
        const textBlocks = response.content.filter(block => block.type === 'text');

        if (textBlocks.length === 0) {
            throw new Error('No text content in Claude response');
        }

        const responseText = textBlocks.map(block => block.text).join('\n\n');

        return {
            response: responseText,
            usage: response.usage,
            stopReason: response.stop_reason,
            escalated: escalationTriggered
        };

    } catch (error) {
        console.error('Error generating Claude response:', error);
        throw new Error(`Failed to generate response: ${error.message}`);
    }
}
