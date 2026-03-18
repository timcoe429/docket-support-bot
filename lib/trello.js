// Trello API Integration
const TRELLO_API_KEY = process.env.TRELLO_API_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;
const TRELLO_BOARD_ID = process.env.TRELLO_BOARD_ID;

const TRELLO_BASE_URL = 'https://api.trello.com/1';

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
