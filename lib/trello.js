// TODO: Implement real Trello API when key available
// Currently stubbed for testing

const TRELLO_API_KEY = process.env.TRELLO_API_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;
const TRELLO_NEW_LIST_ID = process.env.TRELLO_NEW_LIST_ID;

const LABEL_IDS = {
  billing: process.env.TRELLO_LABEL_BILLING,
  websiteEdits: process.env.TRELLO_LABEL_WEBSITE_EDITS,
  technicalIssue: process.env.TRELLO_LABEL_TECHNICAL_ISSUE,
  onboarding: process.env.TRELLO_LABEL_ONBOARDING,
  accountAccess: process.env.TRELLO_LABEL_ACCOUNT_ACCESS,
  generalQuestion: process.env.TRELLO_LABEL_GENERAL_QUESTION,
  urgent: process.env.TRELLO_LABEL_URGENT
};

/**
 * Detect category based on message content
 */
export function detectCategory(message) {
  const msg = message.toLowerCase();
  
  if (/invoice|payment|bill|charge|refund|money/.test(msg)) return 'billing';
  if (/photo|image|picture|hours|update|change|edit/.test(msg)) return 'websiteEdits';
  if (/broken|not working|error|down|issue|bug/.test(msg)) return 'technicalIssue';
  if (/new|setup|getting started|onboarding|just launched/.test(msg)) return 'onboarding';
  if (/login|password|access|can't get in|locked out/.test(msg)) return 'accountAccess';
  
  return 'generalQuestion';
}

/**
 * Check if message indicates urgency
 */
export function isUrgent(message) {
  const msg = message.toLowerCase();
  return /cancel|refund|angry|frustrated|terrible|awful|furious|lawyer|legal|sue|unacceptable/.test(msg);
}

/**
 * Format conversation for Trello card description
 */
export function formatCardDescription(data) {
  const { clientEmail, conversationHistory, churnZeroContext, trelloContext, escalationReason } = data;
  
  let desc = `## Client Information\n`;
  desc += `- **Email:** ${clientEmail || 'Not provided'}\n`;
  desc += `- **Date:** ${new Date().toLocaleString()}\n\n`;
  desc += `---\n\n`;
  
  desc += `## Conversation Transcript\n`;
  conversationHistory.forEach(msg => {
    const role = msg.role === 'user' ? 'Client' : 'Support Bot';
    desc += `**${role}:** ${msg.content}\n\n`;
  });
  desc += `---\n\n`;
  
  desc += `## Context\n\n`;
  desc += `### ChurnZero Data\n`;
  if (churnZeroContext?.account) {
    desc += `- Account: ${churnZeroContext.account.name}\n`;
    desc += `- Status: ${churnZeroContext.account.status || 'Unknown'}\n`;
    if (churnZeroContext.recentEmails?.length > 0) {
      desc += `- Recent emails:\n`;
      churnZeroContext.recentEmails.slice(0, 3).forEach(email => {
        desc += `  - ${email.subject} (${email.date})\n`;
      });
    }
  } else {
    desc += `ChurnZero data not available\n`;
  }
  
  desc += `\n### Project Data\n`;
  if (trelloContext?.activeProjects?.length > 0) {
    trelloContext.activeProjects.forEach(project => {
      desc += `- ${project.name}: ${project.status}\n`;
    });
  } else {
    desc += `No active projects found\n`;
  }
  
  desc += `\n---\n\n`;
  desc += `## Auto-Generated Notes\n`;
  desc += `- **Escalation reason:** ${escalationReason || 'Unknown'}\n`;
  
  return desc;
}

/**
 * Create a support card on Trello
 */
export async function createSupportCard(data) {
  const { conversationHistory, escalationReason } = data;
  
  // Get title from last client message
  const clientMessages = conversationHistory.filter(m => m.role === 'user');
  const lastMessage = clientMessages[clientMessages.length - 1]?.content || 'Support Request';
  const title = lastMessage.substring(0, 60) + (lastMessage.length > 60 ? '...' : '');
  
  // Detect category and urgency
  const category = detectCategory(lastMessage);
  const urgent = isUrgent(lastMessage);
  
  // Format description
  const description = formatCardDescription(data);
  
  // Build labels
  const labels = [LABEL_IDS[category]].filter(Boolean);
  if (urgent && LABEL_IDS.urgent) {
    labels.push(LABEL_IDS.urgent);
  }
  
  // STUBBED - Log what would be created
  console.log('=== TRELLO CARD WOULD BE CREATED ===');
  console.log('Title:', title);
  console.log('Category:', category);
  console.log('Urgent:', urgent);
  console.log('Labels:', labels);
  console.log('Description preview:', description.substring(0, 200) + '...');
  console.log('=====================================');
  
  // TODO: Replace with real API call when keys available:
  /*
  const response = await fetch(
    `https://api.trello.com/1/cards?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: title,
        desc: description,
        idList: TRELLO_NEW_LIST_ID,
        idLabels: labels,
      })
    }
  );
  
  const card = await response.json();
  
  // Add checklist
  const checklistResponse = await fetch(
    `https://api.trello.com/1/checklists?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idCard: card.id,
        name: 'Action Items'
      })
    }
  );
  
  const checklist = await checklistResponse.json();
  
  // Add checklist items
  const items = [
    'Review conversation',
    'Respond to client',
    'Verify issue resolved'
  ];
  
  for (const item of items) {
    await fetch(
      `https://api.trello.com/1/checklists/${checklist.id}/checkItems?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: item })
      }
    );
  }
  
  return card;
  */
  
  // Return mock for testing
  return {
    id: 'mock-card-' + Date.now(),
    name: title,
    url: 'https://trello.com/c/mockcard',
    success: true
  };
}

// Keep these stubs for compatibility
export async function searchCardsByClient(clientName, clientEmail) {
  return [];
}

export async function getCardDetails(cardId) {
  return null;
}

export async function getClientProjectStatus(clientName, clientEmail) {
  return { hasProjects: false, activeProjects: [], completedProjects: [] };
}

export async function getClientBlockers(clientName, clientEmail) {
  return [];
}
