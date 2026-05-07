import { getConversation, getConversationMessages } from '../lib/db.js';
import { stripHtmlToPlainText } from '../lib/textUtils.js';

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function badRequest(res, msg) {
    res.status(400).send(escapeHtml(msg));
}

/**
 * Internal full transcript viewer (secret in query).
 * GET /api/transcript?id=<uuid>&k=<TRANSCRIPT_VIEW_SECRET>
 */
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.status(405).setHeader('Allow', 'GET');
        return res.send('Method not allowed');
    }

    const secret = process.env.TRANSCRIPT_VIEW_SECRET;
    if (!secret) {
        return res.status(503).send('Transcript viewer not configured');
    }

    const conversationId =
        typeof req.query.id === 'string'
            ? req.query.id.trim()
            : Array.isArray(req.query.id)
              ? req.query.id[0]
              : '';
    const token =
        typeof req.query.k === 'string'
            ? req.query.k
            : Array.isArray(req.query.k)
              ? req.query.k[0]
              : '';

    if (!conversationId || !token || token !== secret) {
        return badRequest(res, 'Not found.');
    }

    try {
        const conversation = await getConversation(conversationId);
        if (!conversation) {
            return badRequest(res, 'Not found.');
        }

        const rows = await getConversationMessages(conversationId);

        const title = `${conversation.business_name || 'Chat'} · ${conversationId}`;

        const headerBits = [];
        headerBits.push(
            `<p><strong>Contact</strong> ${escapeHtml(conversation.contact_full_name || '—')}</p>`
        );
        headerBits.push(
            `<p><strong>Business</strong> ${escapeHtml(conversation.business_name || '—')}</p>`
        );
        headerBits.push(
            `<p><strong>Email</strong> ${escapeHtml(conversation.client_email || '—')}</p>`
        );
        if (conversation.escalation_reason) {
            headerBits.push(
                `<p><strong>Escalation</strong> ${escapeHtml(conversation.escalation_reason)}</p>`
            );
        }

        const messagesHtml = rows
            .map(m => {
                const who = m.role === 'user' ? 'Client' : 'Agent';
                const txt = escapeHtml(stripHtmlToPlainText(m.content || '')).replace(/\n/g, '<br>');
                return `<article class="msg ${m.role === 'user' ? 'user' : 'agent'}"><strong>${escapeHtml(who)}</strong><div>${txt}</div><time>${escapeHtml(String(m.created_at || ''))}</time></article>`;
            })
            .join('\n');

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 24px auto; padding: 0 16px; background: #fafaf9; color: #1c1917; }
    h1 { font-size: 1.1rem; }
    .meta { background: #fff; padding: 12px 16px; border-radius: 12px; border: 1px solid #e7e5e4; margin-bottom: 16px; }
    .meta p { margin: 4px 0; font-size: 14px; }
    article.msg { padding: 12px 14px; border-radius: 10px; margin-bottom: 10px; border: 1px solid #e7e5e4; font-size: 14px; line-height: 1.45; }
    article.agent { background: #ecfeff; }
    article.user { background: #fff; }
    article.msg time { display: block; margin-top: 8px; font-size: 11px; color: #78716c; }
  </style>
</head>
<body>
  <h1>Conversation transcript</h1>
  <div class="meta">${headerBits.join('')}</div>
  ${messagesHtml}
</body>
</html>`;

        res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    } catch (e) {
        console.error('transcript handler error:', e);
        res.status(500).send('Error loading transcript');
    }
}
