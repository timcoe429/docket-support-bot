import Anthropic from '@anthropic-ai/sdk';
import { KNOWLEDGE_BASE } from './knowledge.js';
import { findClientCard, formatProjectStatus } from './trello.js';
import { sendSlackEscalation } from './slack.js';
import { getConversation, updateConversationContact } from './db.js';
import { getPublicAppBaseUrl } from './appUrl.js';
import { buildSupportAvailabilitySystemSection } from './supportSchedule.js';
import { renderAssistantMarkdownToHtml } from './chatMarkdown.js';

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

Tone: casual, friendly, and short — like texting a coworker. Have a conversation. Ask questions. Don't bury people in prose.

Your replies render as Markdown (the app converts to clean HTML automatically). Lean into Markdown — it's how you already write.
- Use a blank line between paragraphs.
- Use **bold**, bullet or numbered lists, and links as [label](https://...) when helpful.
- If you need multiple pieces of info (especially full name + business + email): use **one bullet per item** — never one long stitched sentence.

Echo-back before escalate_to_team: same idea — compact list.

Website support is not phone-based. If someone asks for a phone call, explain Docket Websites follows up by **email only** (websites@yourdocket.com is fine to mention). Never imply callbacks or scheduled phones.

When you need the Websites team to take over — using the escalate_to_team tool — you MUST collect full name, business/company name, and best email in chat first. Echo spelling (especially email) and wait for thumbs-up before the tool call. Never guess contact details — only verbatim what they said.

Always read the LIVE WEBSITE DESK STATUS section injected below — it tells you if the desk is OPEN or CLOSED right now (Mountain Time). When CLOSED, say follow-up lands on the next business day — never imply instant human takeover after hours, weekends, or federal holidays.

You have internal reference docs and sometimes project data from our systems — use naturally.

When a client needs Elementor or WordPress help, use web search for current docs and walk them through it.`;

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
        description:
            'Notify the Websites team via Slack ONLY after you personally asked for and received — in chat — full name, business name, and email, echoed back and acknowledged (especially email spelling). Explain email-only follow-up first if they asked for phone. If the LIVE WEBSITE DESK STATUS says CLOSED, remind them human follow-up starts next business day even though Slack may alert internally. Issues: DNS, installs, outages, ambiguity, anything you cannot safely resolve.',
        input_schema: {
            type: "object",
            properties: {
                reason: {
                    type: 'string',
                    description: 'Short internal summary for Slack (why we need human help)'
                },
                contact_full_name: {
                    type: 'string',
                    description: "Client contact's full name as they gave it — no guessing"
                },
                business_name: {
                    type: 'string',
                    description: 'Company / brand name associated with their site'
                },
                contact_email: {
                    type: 'string',
                    description: 'Email they confirmed in conversation — verbatim, valid format — must match what the client affirmed'
                }
            },
            required: ['reason', 'contact_full_name', 'business_name', 'contact_email']
        }
    }
];

function trimContact(value) {
    if (value == null) return '';
    const t = String(value).trim();
    return t;
}

function normalizedEmail(candidate, storedEmail) {
    const fromDb = trimContact(storedEmail).toLowerCase();
    if (fromDb && fromDb !== 'anonymous' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromDb)) {
        return fromDb;
    }
    const fromTool = trimContact(candidate).toLowerCase();
    if (fromTool && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromTool)) {
        return fromTool;
    }
    return '';
}

/**
 * Execute a tool call from Claude
 * @param {object} execContext — { conversationId }
 */
async function executeTool(toolName, toolInput, execContext = {}) {
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
            const conversationId = execContext.conversationId;
            if (!conversationId) {
                return JSON.stringify({
                    escalation_blocked: true,
                    guidance: 'Internal error — ask the client to refresh and try again, or email websites@yourdocket.com.'
                });
            }

            try {
                const conv = await getConversation(conversationId);
                if (!conv) {
                    return JSON.stringify({ escalation_blocked: true, guidance: 'Conversation not found. Ask the client to start a new chat.' });
                }

                const fullName = trimContact(conv.contact_full_name) || trimContact(toolInput.contact_full_name);
                const businessName = trimContact(conv.business_name) || trimContact(toolInput.business_name);
                const email = normalizedEmail(toolInput.contact_email, conv.client_email);

                const missing = [];
                if (!fullName) missing.push('full name');
                if (!businessName) missing.push('business name');
                if (!email) missing.push('email address');

                if (missing.length) {
                    return JSON.stringify({
                        escalation_blocked: true,
                        missing_fields: missing,
                        guidance:
                            `Cannot notify the team yet — still need ${missing.join(', ')}. Ask casually in chat. Remind them the team replies by email. After they answer, repeat all three details and get confirmation before trying again.`
                    });
                }

                await updateConversationContact(conversationId, {
                    fullName,
                    businessName,
                    email
                });

                const base = getPublicAppBaseUrl();
                const secret = process.env.TRANSCRIPT_VIEW_SECRET || '';
                const transcriptUrl =
                    base && secret
                        ? `${base}/api/transcript?id=${encodeURIComponent(conversationId)}&k=${encodeURIComponent(secret)}`
                        : null;

                await sendSlackEscalation({
                    conversationId,
                    fullName,
                    businessName,
                    email,
                    issue: toolInput.reason,
                    transcriptUrl
                });

                return JSON.stringify({
                    success: true,
                    message: 'Team has been notified via Slack with email follow-up.'
                });
            } catch (error) {
                console.error('Escalation error:', error);
                return JSON.stringify({
                    error:
                        'Could not notify team this moment. Ask the client to email websites@yourdocket.com with their business name so we can help.'
                });
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
    const conversationId = context.conversationId || null;
    try {
        const client = getAnthropicClient();

        // Build the system prompt with knowledge base
        const fullSystemPrompt =
            SYSTEM_PROMPT +
            '\n\n' +
            buildSupportAvailabilitySystemSection() +
            '\n--- INTERNAL REFERENCE DOCS ---\n' +
            KNOWLEDGE_BASE;

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

                const result = await executeTool(toolUse.name, toolUse.input, { conversationId });

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

        const responseText = renderAssistantMarkdownToHtml(textBlocks.map(block => block.text).join('\n\n'));

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
