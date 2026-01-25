# Decisions Log

## Architecture

**Vercel + Neon vs Railway + Supabase**
- Chose: Vercel (free) + Neon (free)
- Why: $0/month total. Serverless cold starts (~1s) acceptable for 50-80 users/month. Neon has good SQL editor. Can upgrade Vercel later if needed.

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

**Trello support board vs email escalation**
- Chose: Trello cards
- Why: Visual tracking, no emails getting lost, team already uses Trello, can see patterns in support requests, cards have full context attached

## Bot Behavior

**Tone: Friendly but firm**
- Chose: Not overly apologetic, uses "receipts" (references actual sent emails/dates)
- Why: Clients often blame Docket for their own inaction. Bot should politely hold them accountable.

**No AI acknowledgment**
- Chose: Bot never says "As an AI" or similar
- Why: Should feel like chatting with a support team member, not a bot.
