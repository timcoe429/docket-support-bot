import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('Missing DATABASE_URL environment variable');
}

const sql = neon(process.env.DATABASE_URL);

// Database helper functions

/**
 * Create a new conversation
 * @param {string} clientEmail - Client email address (defaults to 'anonymous' for unauthenticated users)
 */
export async function createConversation(clientEmail = 'anonymous') {
  const result = await sql`
    INSERT INTO conversations (client_email, status)
    VALUES (${clientEmail}, 'active')
    RETURNING *
  `;
  
  if (!result || result.length === 0) {
    throw new Error('Failed to create conversation');
  }
  
  return result[0];
}

/**
 * Get conversation by ID
 */
export async function getConversation(conversationId) {
  const result = await sql`
    SELECT * FROM conversations
    WHERE id = ${conversationId}
  `;
  
  if (!result || result.length === 0) {
    throw new Error('Conversation not found');
  }
  
  return result[0];
}

/**
 * Get conversation by client email (most recent active)
 */
export async function getActiveConversation(clientEmail) {
  const result = await sql`
    SELECT * FROM conversations
    WHERE client_email = ${clientEmail}
      AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1
  `;
  
  // Return null if no results (replaces PGRST116 check)
  if (!result || result.length === 0) {
    return null;
  }
  
  return result[0];
}

/**
 * Update conversation status
 */
export async function updateConversationStatus(conversationId, status, escalationReason = null) {
  if (escalationReason) {
    const result = await sql`
      UPDATE conversations
      SET status = ${status},
          escalation_reason = ${escalationReason},
          updated_at = NOW()
      WHERE id = ${conversationId}
      RETURNING *
    `;
    
    if (!result || result.length === 0) {
      throw new Error('Failed to update conversation');
    }
    
    return result[0];
  } else {
    const result = await sql`
      UPDATE conversations
      SET status = ${status},
          updated_at = NOW()
      WHERE id = ${conversationId}
      RETURNING *
    `;
    
    if (!result || result.length === 0) {
      throw new Error('Failed to update conversation');
    }
    
    return result[0];
  }
}

/**
 * Add a message to a conversation
 */
export async function addMessage(conversationId, role, content, contextUsed = null) {
  const result = await sql`
    INSERT INTO messages (conversation_id, role, content, context_used)
    VALUES (${conversationId}, ${role}, ${content}, ${contextUsed ? JSON.stringify(contextUsed) : null})
    RETURNING *
  `;
  
  if (!result || result.length === 0) {
    throw new Error('Failed to add message');
  }
  
  return result[0];
}

/**
 * Get all messages for a conversation
 */
export async function getConversationMessages(conversationId) {
  const result = await sql`
    SELECT * FROM messages
    WHERE conversation_id = ${conversationId}
    ORDER BY created_at ASC
  `;
  
  return result || [];
}

/**
 * Create or get existing session
 */
export async function createSession(clientEmail, verified = false) {
  // Check for existing valid session
  const now = new Date().toISOString();
  const existingResult = await sql`
    SELECT * FROM sessions
    WHERE client_email = ${clientEmail}
      AND verified = ${verified}
      AND expires_at > ${now}
    ORDER BY created_at DESC
    LIMIT 1
  `;
  
  if (existingResult && existingResult.length > 0) {
    return existingResult[0];
  }

  // Create new session
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  
  const result = await sql`
    INSERT INTO sessions (client_email, verified, expires_at)
    VALUES (${clientEmail}, ${verified}, ${expiresAt.toISOString()})
    RETURNING *
  `;
  
  if (!result || result.length === 0) {
    throw new Error('Failed to create session');
  }
  
  return result[0];
}

/**
 * Get session by ID
 */
export async function getSession(sessionId) {
  const result = await sql`
    SELECT * FROM sessions
    WHERE id = ${sessionId}
  `;
  
  if (!result || result.length === 0) {
    throw new Error('Session not found');
  }
  
  return result[0];
}

/**
 * Verify a session
 */
export async function verifySession(sessionId) {
  const result = await sql`
    UPDATE sessions
    SET verified = true
    WHERE id = ${sessionId}
    RETURNING *
  `;
  
  if (!result || result.length === 0) {
    throw new Error('Failed to verify session');
  }
  
  return result[0];
}

/**
 * Search knowledge base by keywords
 * Fetches all items with SQL, then filters in JavaScript (same as current implementation)
 */
export async function searchKnowledgeBase(query) {
  const searchTerms = query.toLowerCase().split(/\s+/);
  
  // Fetch all knowledge base items
  const result = await sql`
    SELECT * FROM knowledge_base
  `;
  
  if (!result || result.length === 0) {
    return [];
  }

  // Simple keyword matching - same logic as before
  const matches = result.filter(item => {
    const questionLower = item.question.toLowerCase();
    const answerLower = item.answer.toLowerCase();
    const keywordsLower = (item.keywords || []).map(k => k.toLowerCase());
    
    return searchTerms.some(term => 
      questionLower.includes(term) || 
      answerLower.includes(term) ||
      keywordsLower.some(k => k.includes(term))
    );
  });

  return matches;
}

/**
 * Get knowledge base item by category
 */
export async function getKnowledgeBaseByCategory(category) {
  const result = await sql`
    SELECT * FROM knowledge_base
    WHERE category = ${category}
  `;
  
  return result || [];
}
