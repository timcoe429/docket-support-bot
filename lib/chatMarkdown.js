import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

marked.use({
    breaks: true,
    gfm: true
});

const SANITIZE_OPTIONS = {
    allowedTags: [
        'p',
        'br',
        'blockquote',
        'h2',
        'h3',
        'h4',
        'hr',
        'ul',
        'ol',
        'li',
        'strong',
        'b',
        'em',
        'i',
        's',
        'del',
        'a',
        'code',
        'pre',
        'table',
        'thead',
        'tbody',
        'tr',
        'th',
        'td'
    ],
    allowedAttributes: {
        a: ['href', 'title'],
        th: ['align'],
        td: ['align']
    },
    allowedSchemes: ['http', 'https', 'mailto']
};

/**
 * Turn model output (Markdown) into safe HTML for chat bubbles.
 * Models default to Markdown; this matches how they behave instead of wrestling raw HTML rules.
 */
export function renderAssistantMarkdownToHtml(markdownText) {
    if (markdownText == null || String(markdownText).trim() === '') {
        return '';
    }
    try {
        const raw = marked.parse(String(markdownText), { async: false });
        return sanitizeHtml(raw, {
            ...SANITIZE_OPTIONS,
            transformTags: {
                a(tagName, attribs) {
                    return {
                        tagName: 'a',
                        attribs: {
                            ...attribs,
                            target: '_blank',
                            rel: 'noopener noreferrer'
                        }
                    };
                }
            }
        });
    } catch (e) {
        console.error('chatMarkdown render error:', e);
        const s = String(markdownText);
        return sanitizeHtml(`<p>${s.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`, SANITIZE_OPTIONS);
    }
}
