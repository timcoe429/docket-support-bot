import dotenv from 'dotenv';

dotenv.config();

const TRELLO_API_KEY = process.env.TRELLO_API_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;
const TRELLO_BASE_URL = 'https://api.trello.com/1';

/**
 * Make a request to Trello API
 */
async function trelloRequest(endpoint, method = 'GET', body = null) {
  if (!TRELLO_API_KEY || !TRELLO_TOKEN) {
    throw new Error('Trello API credentials not configured');
  }

  const url = `${TRELLO_BASE_URL}${endpoint}?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Trello API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Trello API request failed:', error);
    throw error;
  }
}

/**
 * Search for cards by client name or email
 */
export async function searchCardsByClient(clientName, clientEmail) {
  try {
    // Search for cards containing client name or email
    const query = `${clientName} ${clientEmail}`;
    const response = await trelloRequest(
      `/search?query=${encodeURIComponent(query)}&modelTypes=cards&cards_limit=10`
    );
    
    if (response && response.cards) {
      return response.cards;
    }
    
    return [];
  } catch (error) {
    console.error('Error searching Trello cards:', error);
    return [];
  }
}

/**
 * Get card details including status and checklists
 */
export async function getCardDetails(cardId) {
  try {
    const card = await trelloRequest(`/cards/${cardId}`);
    
    // Get card actions (comments, updates)
    const actions = await trelloRequest(`/cards/${cardId}/actions?limit=10`);
    
    // Get checklists
    const checklists = await trelloRequest(`/cards/${cardId}/checklists`);
    
    // Get list (status)
    let list = null;
    if (card.idList) {
      list = await trelloRequest(`/lists/${card.idList}`);
    }

    return {
      id: card.id,
      name: card.name,
      description: card.desc,
      url: card.url,
      status: list ? list.name : 'Unknown',
      dueDate: card.due,
      labels: card.labels || [],
      checklists: checklists.map(cl => ({
        name: cl.name,
        items: cl.checkItems.map(item => ({
          name: item.name,
          completed: item.state === 'complete'
        }))
      })),
      recentActions: actions.slice(0, 5).map(action => ({
        type: action.type,
        date: action.date,
        member: action.memberCreator ? action.memberCreator.fullName : null,
        data: action.data
      }))
    };
  } catch (error) {
    console.error('Error getting card details:', error);
    return null;
  }
}

/**
 * Get project status for a client
 */
export async function getClientProjectStatus(clientName, clientEmail) {
  try {
    const cards = await searchCardsByClient(clientName, clientEmail);
    
    if (cards.length === 0) {
      return {
        hasProjects: false,
        projects: []
      };
    }

    // Get details for each card
    const projectDetails = await Promise.all(
      cards.slice(0, 5).map(card => getCardDetails(card.id))
    );

    const activeProjects = projectDetails.filter(p => p && p.status !== 'Done' && p.status !== 'Archived');
    const completedProjects = projectDetails.filter(p => p && (p.status === 'Done' || p.status === 'Archived'));

    return {
      hasProjects: true,
      activeProjects: activeProjects.map(p => ({
        name: p.name,
        status: p.status,
        url: p.url,
        dueDate: p.dueDate,
        description: p.description,
        checklists: p.checklists
      })),
      completedProjects: completedProjects.map(p => ({
        name: p.name,
        status: p.status,
        url: p.url
      })),
      allProjects: projectDetails
    };
  } catch (error) {
    console.error('Error getting client project status:', error);
    return {
      hasProjects: false,
      projects: [],
      error: error.message
    };
  }
}

/**
 * Get blockers or incomplete items for a client
 */
export async function getClientBlockers(clientName, clientEmail) {
  try {
    const projectStatus = await getClientProjectStatus(clientName, clientEmail);
    
    if (!projectStatus.hasProjects) {
      return [];
    }

    const blockers = [];
    
    projectStatus.activeProjects.forEach(project => {
      project.checklists.forEach(checklist => {
        checklist.items.forEach(item => {
          if (!item.completed) {
            blockers.push({
              project: project.name,
              task: item.name,
              checklist: checklist.name,
              projectUrl: project.url
            });
          }
        });
      });
    });

    return blockers;
  } catch (error) {
    console.error('Error getting client blockers:', error);
    return [];
  }
}
