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

    if (transcriptUrl) {
        blocks.push({
            type: 'actions',
            elements: [
                {
                    type: 'button',
                    text: {
                        type: 'plain_text',
                        text: 'Open full transcript (internal)',
                        emoji: true
                    },
                    url: transcriptUrl,
                    style: 'primary'
                }
            ]
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
            console.error('Slack webhook error:', response.status);
        }
    } catch (error) {
        console.error('Failed to send Slack notification:', error);
    }
}
