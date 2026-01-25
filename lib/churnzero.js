// TODO: Implement real ChurnZero API when key available

const CHURNZERO_API_KEY = process.env.CHURNZERO_API_KEY;
const CHURNZERO_APP_KEY = process.env.CHURNZERO_APP_KEY;
const CHURNZERO_BASE_URL = 'https://api.churnzero.net/v2';

/**
 * Make a request to ChurnZero API
 * TODO: Implement real API calls when credentials are available
 */
async function churnZeroRequest(endpoint, method = 'GET', body = null) {
  // Stubbed - return empty response for now
  console.log(`[STUB] ChurnZero API request: ${method} ${endpoint}`);
  return [];
}

/**
 * Get account by email (primary contact)
 * TODO: Implement real ChurnZero API when key available
 */
export async function getAccountByEmail(email) {
  // Stub: Return mock account data
  return {
    id: 'test-account-123',
    name: 'Test Account',
    email: email,
    status: 'active',
    createdDate: new Date().toISOString()
  };
}

/**
 * Get primary contact for an account
 * TODO: Implement real ChurnZero API when key available
 */
export async function getPrimaryContact(accountId) {
  // Stub: Return mock primary contact
  return {
    id: 'test-contact-123',
    email: 'test@example.com',
    name: 'Test Contact',
    isPrimary: true
  };
}

/**
 * Verify email is a primary contact
 * TODO: Implement real ChurnZero API when key available
 */
export async function verifyEmailIsPrimaryContact(email) {
  // Stub: Always return verified for testing
  return {
    verified: true,
    account: {
      id: 'test-account-123',
      name: 'Test Account',
      email: email
    },
    contact: {
      id: 'test-contact-123',
      email: email,
      name: 'Test Contact',
      isPrimary: true
    }
  };
}

/**
 * Get recent activity/emails for an account
 * TODO: Implement real ChurnZero API when key available
 */
export async function getRecentActivity(accountId, limit = 10) {
  // Stub: Return empty array
  return [];
}

/**
 * Get account details with recent activity
 * TODO: Implement real ChurnZero API when key available
 */
export async function getAccountContext(email) {
  // Stub: Return mock account context
  return {
    account: {
      id: 'test-account-123',
      name: 'Test Account',
      email: email,
      status: 'active',
      createdDate: new Date().toISOString()
    },
    recentEmails: [],
    recentActivity: []
  };
}
