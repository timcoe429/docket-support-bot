/**
 * Send escalation notification to Slack
 */
export async function sendSlackEscalation({ clientName, issue, chatSummary, trelloCardUrl }) {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!webhookUrl) {
        console.error('SLACK_WEBHOOK_URL not configured');
        return;
    }

    const payload = {
        blocks: [
            {
                type: "header",
                text: {
                    type: "plain_text",
                    text: "🔴 Support Escalation",
                    emoji: true
                }
            },
            {
                type: "section",
                fields: [
                    {
                        type: "mrkdwn",
                        text: `*Client:*\n${clientName || 'Unknown'}`
                    },
                    {
                        type: "mrkdwn",
                        text: `*Reason:*\n${issue || 'Requested human help'}`
                    }
                ]
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `*Chat Summary:*\n${chatSummary || 'No summary available'}`
                }
            }
        ]
    };

    // Add Trello link if available
    if (trelloCardUrl) {
        payload.blocks.push({
            type: "actions",
            elements: [
                {
                    type: "button",
                    text: {
                        type: "plain_text",
                        text: "View Trello Card",
                        emoji: true
                    },
                    url: trelloCardUrl
                }
            ]
        });
    }

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
