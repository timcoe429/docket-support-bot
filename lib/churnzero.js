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
  return null;
}

/**
 * Get primary contact for an account
 * TODO: Implement real ChurnZero API when key available
 */
export async function getPrimaryContact(accountId) {
  return null;
}

/**
 * Verify email is a primary contact
 * TODO: Implement real ChurnZero API when key available
 */
export async function verifyEmailIsPrimaryContact(email) {
  return null;
}

/**
 * Get recent activity/emails for an account
 * TODO: Implement real ChurnZero API when key available
 */
export async function getRecentActivity(accountId, limit = 10) {
  return null;
}

/**
 * Get account details with recent activity
 * TODO: Implement real ChurnZero API when key available
 */
export async function getAccountContext(email) {
  return null;
}
