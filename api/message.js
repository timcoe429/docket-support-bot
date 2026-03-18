import { getConversation, createConversation, addMessage, getConversationMessages, updateConversationStatus } from '../lib/db.js';
import { generateResponse } from '../lib/claude.js';

/**
 * POST /api/message
 * Claude handles everything via tools — no preprocessing
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, conversationId } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Get or create conversation
        let conversation = null;

        if (conversationId) {
            try {
                conversation = await getConversation(conversationId);
            } catch (error) {
                console.error('Could not load conversation:', conversationId);
            }
        }

        if (!conversation) {
            conversation = await createConversation('anonymous');
        }

        // Save user message
        await addMessage(conversation.id, 'user', message);

        // Get conversation history (includes the message we just added)
        const history = await getConversationMessages(conversation.id);
        // Exclude current message — generateResponse adds it
        const formattedHistory = history.slice(0, -1).map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        // Generate response — Claude handles EVERYTHING via tools
        let botResponse = '';
        let escalated = false;

        try {
            const result = await generateResponse(message, formattedHistory, {});

            botResponse = result.response;
            escalated = result.escalated || false;
        } catch (error) {
            console.error('Claude API error:', error);
            botResponse = "I'm having a little trouble on my end right now. Can you try that again? If it keeps happening, shoot us an email at websites@yourdocket.com and we'll get you sorted out.";
        }

        // Save bot response
        await addMessage(conversation.id, 'assistant', botResponse);

        // If Claude triggered escalation, update conversation status
        if (escalated) {
            await updateConversationStatus(conversation.id, 'escalated', 'Agent-initiated escalation');
        }

        // Debug: log raw response
        console.log('=== RAW BOT RESPONSE ===');
        console.log(botResponse.substring(0, 500));
        console.log('=== END RAW RESPONSE ===');

        res.json({
            response: botResponse,
            conversationId: conversation.id,
            escalated: escalated
        });

    } catch (error) {
        console.error('Message handling error:', error);
        res.status(500).json({
            error: 'Failed to process message',
            message: error.message
        });
    }
}
