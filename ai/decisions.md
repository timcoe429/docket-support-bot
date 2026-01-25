# Decisions Log

## Architecture

**Single Railway deployment vs split Vercel + Railway**
- Chose: Single Railway deployment
- Why: Only 50-80 users/month, splitting adds complexity for no benefit. Can split later if needed.

**Vanilla JS vs React for frontend**
- Chose: Vanilla HTML/CSS/JS
- Why: It's just a chat widget. No need for React overhead. Keep it simple.

**No TypeScript**
- Chose: Plain JavaScript
- Why: Faster to build, easier to maintain for this scope. Not a large team project.

## Integrations

**ChurnZero for verification**
- Chose: Verify email against ChurnZero primary contact
- Why: Simple, no extra steps for client if email matches. Can add code verification later if needed.

**Escalation via email to Kayla (not Slack)**
- Chose: Email
- Why: More detail can be included, Kayla can handle async. Slack would be faster but less context.

## Bot Behavior

**Tone: Friendly but firm**
- Chose: Not overly apologetic, uses "receipts" (references actual sent emails/dates)
- Why: Clients often blame Docket for their own inaction. Bot should politely hold them accountable.

**No AI acknowledgment**
- Chose: Bot never says "As an AI" or similar
- Why: Should feel like chatting with a support team member, not a bot.
