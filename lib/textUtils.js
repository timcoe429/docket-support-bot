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
