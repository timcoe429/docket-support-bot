/**
 * Plain text for Slack / summaries — strips HTML chat bubble content.
 */
export function stripHtmlToPlainText(html) {
  if (html == null) return '';
  let s = String(html)
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|section|blockquote|li|tr|h[1-6])>/gi, '\n')
    .replace(/<\s*(p|div|hr)\b[^>]*>/gi, '\n')
    .replace(/<\s*a\b[^>]*href\s*=\s*["']([^"']*)["'][^>]*>/gi, ' $1 ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
  s = s.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

const SLACK_ESCAPABLE = /([&<>])/g;
function slackEscRepl(ch) {
  if (ch === '&') return '&amp;';
  if (ch === '<') return '&lt;';
  if (ch === '>') return '&gt;';
  return ch;
}

/** Escape &, <, > for Slack mrkdwn snippets from user/agent content */
export function escapeSlackMrkdwn(text) {
  if (text == null) return '';
  return String(text).replace(SLACK_ESCAPABLE, slackEscRepl);
}

/**
 * INTERNAL docs shipped to Claude sometimes used **bold**; convert so the model mostly sees <strong>, not Markdown.
 */
export function internalMarkdownBoldToHtml(text) {
  if (text == null) return '';
  return String(text).replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
}

/**
 * Fixes common model slips before HTML chat bubbles: ** becomes <strong>; bare newlines become <br> (otherwise they collapse visually).
 */
export function normalizeAssistantChatHtml(text) {
  if (text == null) return '';
  let t = String(text);
  t = t.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  const hasStructuralHtml = /<\s*br\b|<\s*p\b|<\s*[ou]l\b|<\s*li\b|<\s*\/\s*p\s*>|<\s*\/\s*li\s*>|<\s*div\b/im.test(t);
  if (!hasStructuralHtml && /\r?\n/.test(t)) {
    t = t.replace(/\r?\n\s*\r?\n/g, '<br><br>');
    t = t.replace(/\r?\n/g, '<br>');
  }
  return t;
}
