/**
 * Send escalation notification to Slack
 */
import { escapeSlackMrkdwn } from './textUtils.js';

export async function sendSlackEscalation({
    conversationId,
    fullName,
    businessName,
    email,
    issue,
    transcriptUrl
}) {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!webhookUrl) {
        console.error('SLACK_WEBHOOK_URL not configured');
        return;
    }

    const nameLine = escapeSlackMrkdwn(fullName || '—');
    const bizLine = escapeSlackMrkdwn(businessName || '—');
    const emailLine = escapeSlackMrkdwn(email || '—');
    const reasonLine = escapeSlackMrkdwn(issue || 'Requested human help');

    const blocks = [
        {
            type: 'header',
            text: {
                type: 'plain_text',
                text: '🔴 Support Escalation',
                emoji: true
            }
        },
        {
            type: 'section',
            fields: [
                {
                    type: 'mrkdwn',
                    text: `*Contact name*\n${nameLine}`
                },
                {
                    type: 'mrkdwn',
                    text: `*Business*\n${bizLine}`
                },
                {
                    type: 'mrkdwn',
                    text: `*Email*\n${emailLine}`
                },
                {
                    type: 'mrkdwn',
                    text: `*Conversation ID*\n\`${conversationId}\``
                }
            ]
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*Reason*\n${reasonLine}`
            }
        }
    ];

    // Mrkdwn link avoids Block Kit actions/button URL validation quirks that can 400 the whole webhook.
    if (transcriptUrl) {
        blocks.push({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*Full transcript (internal)*\n<${transcriptUrl}|Open full transcript>`
            }
        });
    }

    const payload = { blocks };

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errBody = await response.text().catch(() => '');
            console.error(
                'Slack webhook error:',
                response.status,
                errBody ? errBody.slice(0, 500) : ''
            );
        }
    } catch (error) {
        console.error('Failed to send Slack notification:', error);
    }
}
