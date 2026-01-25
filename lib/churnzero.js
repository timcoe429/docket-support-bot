const CHURNZERO_API_KEY = process.env.CHURNZERO_API_KEY;
const CHURNZERO_APP_KEY = process.env.CHURNZERO_APP_KEY;
const CHURNZERO_BASE_URL = 'https://api.churnzero.net/v2';

/**
 * Make a request to ChurnZero API
 */
async function churnZeroRequest(endpoint, method = 'GET', body = null) {
  if (!CHURNZERO_API_KEY || !CHURNZERO_APP_KEY) {
    throw new Error('ChurnZero API credentials not configured');
  }

  const url = `${CHURNZERO_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': CHURNZERO_API_KEY,
      'appkey': CHURNZERO_APP_KEY
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ChurnZero API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('ChurnZero API request failed:', error);
    throw error;
  }
}

/**
 * Get account by email (primary contact)
 */
export async function getAccountByEmail(email) {
  try {
    // ChurnZero API endpoint to get account by contact email
    // Note: Actual endpoint may vary based on ChurnZero API version
    const response = await churnZeroRequest(
      `/accounts?contactEmail=${encodeURIComponent(email)}`
    );
    
    if (response && response.length > 0) {
      return response[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error getting account by email:', error);
    return null;
  }
}

/**
 * Get primary contact for an account
 */
export async function getPrimaryContact(accountId) {
  try {
    const response = await churnZeroRequest(`/accounts/${accountId}/contacts`);
    
    if (response && response.length > 0) {
      // Find primary contact (usually marked as primary or first in list)
      const primaryContact = response.find(contact => contact.isPrimary) || response[0];
      return primaryContact;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting primary contact:', error);
    return null;
  }
}

/**
 * Verify email is a primary contact
 */
export async function verifyEmailIsPrimaryContact(email) {
  try {
    const account = await getAccountByEmail(email);
    
    if (!account) {
      return { verified: false, account: null };
    }

    const primaryContact = await getPrimaryContact(account.id);
    
    if (primaryContact && primaryContact.email.toLowerCase() === email.toLowerCase()) {
      return {
        verified: true,
        account: account,
        contact: primaryContact
      };
    }

    return { verified: false, account: account };
  } catch (error) {
    console.error('Error verifying email:', error);
    return { verified: false, account: null, error: error.message };
  }
}

/**
 * Get recent activity/emails for an account
 */
export async function getRecentActivity(accountId, limit = 10) {
  try {
    const response = await churnZeroRequest(
      `/accounts/${accountId}/activities?limit=${limit}&orderBy=createdDate&orderDirection=desc`
    );
    
    return response || [];
  } catch (error) {
    console.error('Error getting recent activity:', error);
    return [];
  }
}

/**
 * Get account details with recent activity
 */
export async function getAccountContext(email) {
  try {
    const account = await getAccountByEmail(email);
    
    if (!account) {
      return null;
    }

    const recentActivity = await getRecentActivity(account.id, 20);
    
    // Filter for email activities
    const emailActivities = recentActivity.filter(
      activity => activity.type === 'Email' || activity.activityType === 'Email'
    );

    return {
      account: {
        id: account.id,
        name: account.name,
        email: account.email,
        status: account.status,
        createdDate: account.createdDate
      },
      recentEmails: emailActivities.map(activity => ({
        subject: activity.subject || activity.name,
        date: activity.createdDate || activity.date,
        direction: activity.direction || 'unknown',
        body: activity.body || activity.description
      })),
      recentActivity: recentActivity.slice(0, 10).map(activity => ({
        type: activity.type || activity.activityType,
        name: activity.name || activity.subject,
        date: activity.createdDate || activity.date,
        description: activity.description || activity.body
      }))
    };
  } catch (error) {
    console.error('Error getting account context:', error);
    return null;
  }
}
