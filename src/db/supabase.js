import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database helper functions

/**
 * Create a new conversation
 */
export async function createConversation(clientEmail) {
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      client_email: clientEmail,
      status: 'active'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get conversation by ID
 */
export async function getConversation(conversationId) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get conversation by client email (most recent active)
 */
export async function getActiveConversation(clientEmail) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('client_email', clientEmail)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
  return data;
}

/**
 * Update conversation status
 */
export async function updateConversationStatus(conversationId, status, escalationReason = null) {
  const updateData = {
    status,
    updated_at: new Date().toISOString()
  };

  if (escalationReason) {
    updateData.escalation_reason = escalationReason;
  }

  const { data, error } = await supabase
    .from('conversations')
    .update(updateData)
    .eq('id', conversationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Add a message to a conversation
 */
export async function addMessage(conversationId, role, content, contextUsed = null) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role,
      content,
      context_used: contextUsed
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get all messages for a conversation
 */
export async function getConversationMessages(conversationId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Create or get existing session
 */
export async function createSession(clientEmail, verified = false) {
  // Check for existing valid session
  const { data: existingSession } = await supabase
    .from('sessions')
    .select('*')
    .eq('client_email', clientEmail)
    .eq('verified', verified)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (existingSession) {
    return existingSession;
  }

  // Create new session
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      client_email: clientEmail,
      verified,
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get session by ID
 */
export async function getSession(sessionId) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Verify a session
 */
export async function verifySession(sessionId) {
  const { data, error } = await supabase
    .from('sessions')
    .update({ verified: true })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Search knowledge base by keywords
 */
export async function searchKnowledgeBase(query) {
  const searchTerms = query.toLowerCase().split(/\s+/);
  
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('*');

  if (error) throw error;

  // Simple keyword matching - can be improved with full-text search
  const matches = data.filter(item => {
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
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('*')
    .eq('category', category);

  if (error) throw error;
  return data;
}
