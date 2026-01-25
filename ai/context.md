# Project Context

## What This Is
Docket Support Bot - A client support chatbot for Docket, a SaaS company serving roll-off dumpster and waste management businesses. Handles client questions via chat (and later email), pulls context from ChurnZero and Trello, and escalates to a human when needed.

## Tech Stack
- Hosting: Vercel (serverless functions + static hosting)
- Database: Neon (serverless Postgres)
- AI: Claude API (Anthropic) - stubbed
- Integrations: ChurnZero (stubbed), Trello (stubbed), SendGrid (disabled)
- Frontend: Vanilla HTML/CSS/JS (no React)
- Escalation: Trello cards (not email)

## Non-Negotiables
- Bot never says "As an AI" or acknowledges being a bot
- Tone is friendly but firm, not overly apologetic
- When client complains about delays, bot uses "receipts" — references actual emails sent and dates
- Escalation creates Trello card with full context
- Simple and maintainable — this serves 50-80 users/month, don't over-engineer
- **UI must look modern and premium — no shipping until it looks Fortune 500**

## What We Don't Want
- No React or heavy frontend frameworks
- No TypeScript
- No unnecessary dependencies
- No over-engineering
- No splitting frontend/backend into separate deployments

## Target Users
Website clients (roll-off dumpster businesses) who ask repetitive questions, often about onboarding status or things already communicated via email. Many don't read their emails and then complain.

## Key URLs
- Chat will live at: support.yourdocketonline.com
- Escalation creates cards on Trello support board
