// Trello API Integration
const TRELLO_API_KEY = process.env.TRELLO_API_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;
const TRELLO_BOARD_ID = process.env.TRELLO_BOARD_ID;
const TRELLO_NEW_LIST_ID = process.env.TRELLO_NEW_LIST_ID;

const TRELLO_BASE_URL = 'https://api.trello.com/1';

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

/**
 * Search for a card by company name on the board
 */
export async function findClientCard(companyName) {
    if (!TRELLO_API_KEY || !TRELLO_TOKEN || !TRELLO_BOARD_ID) {
        console.error('Trello credentials not configured');
        return null;
    }

    try {
        // Get all cards on the board with custom fields
        const url = `${TRELLO_BASE_URL}/boards/${TRELLO_BOARD_ID}/cards?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}&customFieldItems=true`;
        const response = await fetch(url);
        
        if (!response.ok) {
            console.error('Trello API error:', response.status);
            return null;
        }

        const cards = await response.json();

        // Search for matching card (case-insensitive, partial match)
        const searchTerm = companyName.toLowerCase().trim();
        const matchingCard = cards.find(card => 
            card.name.toLowerCase().includes(searchTerm) ||
            searchTerm.includes(card.name.toLowerCase())
        );

        if (!matchingCard) {
            return null;
        }

        // Get the list (stage) this card is in
        const listUrl = `${TRELLO_BASE_URL}/lists/${matchingCard.idList}?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`;
        const listResponse = await fetch(listUrl);
        const list = await listResponse.json();

        // Get custom field definitions for this board
        const customFieldsUrl = `${TRELLO_BASE_URL}/boards/${TRELLO_BOARD_ID}/customFields?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`;
        const customFieldsResponse = await fetch(customFieldsUrl);
        const customFieldDefinitions = await customFieldsResponse.json();

        // Map custom field values to readable format
        const customFields = parseCustomFields(matchingCard.customFieldItems, customFieldDefinitions);

        return {
            name: matchingCard.name,
            stage: list.name,
            url: matchingCard.shortUrl,
            customFields: customFields,
            lastActivity: matchingCard.dateLastActivity
        };

    } catch (error) {
        console.error('Error fetching Trello data:', error);
        return null;
    }
}

/**
 * Parse custom field items into readable key-value pairs
 */
function parseCustomFields(fieldItems, fieldDefinitions) {
    if (!fieldItems || !fieldDefinitions) return {};

    const fields = {};

    for (const item of fieldItems) {
        const definition = fieldDefinitions.find(def => def.id === item.idCustomField);
        if (!definition) continue;

        const fieldName = definition.name;
        let fieldValue = null;

        // Handle different field types
        if (item.value) {
            if (item.value.text) {
                fieldValue = item.value.text;
            } else if (item.value.number) {
                fieldValue = item.value.number;
            } else if (item.value.checked !== undefined) {
                fieldValue = item.value.checked === 'true';
            }
        } else if (item.idValue && definition.options) {
            // Dropdown field - find the selected option
            const option = definition.options.find(opt => opt.id === item.idValue);
            if (option) {
                fieldValue = option.value.text;
            }
        }

        if (fieldValue !== null) {
            fields[fieldName] = fieldValue;
        }
    }

    return fields;
}

/**
 * Get all lists (stages) on the board
 */
export async function getBoardStages() {
    if (!TRELLO_API_KEY || !TRELLO_TOKEN || !TRELLO_BOARD_ID) {
        return [];
    }

    try {
        const url = `${TRELLO_BASE_URL}/boards/${TRELLO_BOARD_ID}/lists?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`;
        const response = await fetch(url);
        const lists = await response.json();
        return lists.map(list => list.name);
    } catch (error) {
        console.error('Error fetching Trello lists:', error);
        return [];
    }
}

/**
 * Format project status for the chatbot response
 */
export function formatProjectStatus(cardData) {
    if (!cardData) {
        return null;
    }

    const { name, stage, customFields } = cardData;

    let status = {
        companyName: name,
        stage: stage,
        domainAccess: customFields['Domain Access'] || 'Unknown',
        domainUrl: customFields['Domain URL'] || null,
        pastelReview: customFields['Pastel Review'] || null,
        pastelEditsLink: customFields['Pastel Edits Link'] || null,
        qaTime: customFields['QA Time (minutes)'] || null
    };

    return status;
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
