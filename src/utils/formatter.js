/**
 * Format context for display in logs or emails
 */
export function formatContext(context) {
  if (!context) {
    return 'No context available';
  }

  let formatted = '';

  if (context.churnZero) {
    formatted += 'ChurnZero Context:\n';
    if (context.churnZero.account) {
      formatted += `  Account: ${context.churnZero.account.name}\n`;
    }
    if (context.churnZero.recentEmails) {
      formatted += `  Recent emails: ${context.churnZero.recentEmails.length}\n`;
    }
  }

  if (context.trello) {
    formatted += 'Trello Context:\n';
    if (context.trello.activeProjects) {
      formatted += `  Active projects: ${context.trello.activeProjects.length}\n`;
    }
  }

  if (context.knowledgeBase) {
    formatted += `Knowledge Base matches: ${context.knowledgeBase.length}\n`;
  }

  return formatted || 'No context available';
}

/**
 * Format conversation history for display
 */
export function formatConversationHistory(messages) {
  return messages.map(msg => {
    const role = msg.role === 'user' ? 'Client' : 'Bot';
    const timestamp = msg.created_at ? new Date(msg.created_at).toLocaleString() : '';
    return `[${timestamp}] ${role}: ${msg.content}`;
  }).join('\n\n');
}

/**
 * Format date for display
 */
export function formatDate(dateString) {
  if (!dateString) return 'Unknown date';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return dateString;
  }
}

/**
 * Truncate text to max length
 */
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength - 3) + '...';
}
