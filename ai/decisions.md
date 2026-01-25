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

## UI/UX

**Two-panel layout with visual polish**
- Chose: Keep 50/50 two-panel layout, add Fortune 500 visual polish
- Why: Original concept was sound, execution looked dated. Adding depth (shadows), warmth (gradients), cards for categories, micro-interactions, and modern typography transforms it from "2010 basic" to "2026 premium SaaS"

**Chat as primary, FAQ as secondary**
- Chose: Both panels visible, but chat is the hero action
- Why: We want users to chat (where AI handles repetitive questions), FAQ is self-service fallback

**Unified header bar**
- Chose: Single header above both panels with logo, title, online status
- Why: Previous design had logo floating in empty space, felt disconnected. Unified header grounds the page.

**Iterate until it's right**
- Chose: Continue refining visuals until it looks premium
- Why: First implementation looked "5th grader" quality. We don't ship until it looks Fortune 500. This is a client-facing tool.
