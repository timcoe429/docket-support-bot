import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const ESCALATION_EMAIL = process.env.ESCALATION_EMAIL || 'kayla@yourdocket.com';

if (!SENDGRID_API_KEY) {
  throw new Error('SendGrid API key not configured');
}

sgMail.setApiKey(SENDGRID_API_KEY);

/**
 * Send escalation email to Kayla
 */
export async function sendEscalationEmail(conversationData) {
  try {
    const {
      clientEmail,
      conversationId,
      escalationReason,
      conversationHistory,
      churnZeroContext,
      trelloContext
    } = conversationData;

    // Format conversation history
    const conversationText = conversationHistory
      .map(msg => `${msg.role === 'user' ? 'Client' : 'Bot'}: ${msg.content}`)
      .join('\n\n');

    // Format ChurnZero context
    let churnZeroText = 'No ChurnZero data available.';
    if (churnZeroContext) {
      churnZeroText = `Account: ${churnZeroContext.account?.name || 'Unknown'}\n`;
      if (churnZeroContext.recentEmails && churnZeroContext.recentEmails.length > 0) {
        churnZeroText += 'Recent emails:\n';
        churnZeroContext.recentEmails.forEach(email => {
          churnZeroText += `- ${email.subject} (${email.date})\n`;
        });
      }
    }

    // Format Trello context
    let trelloText = 'No Trello data available.';
    if (trelloContext && trelloContext.activeProjects) {
      trelloText = 'Active projects:\n';
      trelloContext.activeProjects.forEach(project => {
        trelloText += `- ${project.name}: ${project.status}\n`;
      });
    }

    const emailContent = {
      to: ESCALATION_EMAIL,
      from: {
        email: 'support@yourdocket.com',
        name: 'Docket Support Bot'
      },
      subject: `Support Escalation: ${clientEmail}`,
      text: `
Support Escalation Request

Client Email: ${clientEmail}
Conversation ID: ${conversationId}
Escalation Reason: ${escalationReason || 'Not specified'}

CONVERSATION HISTORY:
${conversationText}

CHURNZERO CONTEXT:
${churnZeroText}

TRELLO CONTEXT:
${trelloText}

Please follow up with the client directly.
      `.trim(),
      html: `
        <h2>Support Escalation Request</h2>
        <p><strong>Client Email:</strong> ${clientEmail}</p>
        <p><strong>Conversation ID:</strong> ${conversationId}</p>
        <p><strong>Escalation Reason:</strong> ${escalationReason || 'Not specified'}</p>
        
        <h3>Conversation History</h3>
        <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${conversationText}</pre>
        
        <h3>ChurnZero Context</h3>
        <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${churnZeroText}</pre>
        
        <h3>Trello Context</h3>
        <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${trelloText}</pre>
        
        <p>Please follow up with the client directly.</p>
      `
    };

    await sgMail.send(emailContent);
    console.log(`Escalation email sent to ${ESCALATION_EMAIL} for client ${clientEmail}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error sending escalation email:', error);
    throw new Error(`Failed to send escalation email: ${error.message}`);
  }
}
