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

## 2024-02-05

### Category Buttons on Welcome Screen
- 4 categories: Website Build Status, Edits & Changes, Login & Access, Something Else
- Green hover effect (#7eb10f) matching Docket brand
- Professional "How can we help?" — no emoji, no chatbot vibe

### Remove Quick Action Buttons
- Were doing keyword matching that showed irrelevant options
- Better to have no buttons than wrong buttons
- Can revisit later with smarter implementation

### Knowledge Base Architecture
- Using markdown files in `/knowledge` folder (not FAQ JSON)
- Reasons: scales better, natural prose for Claude, easy GitHub editing
- Structure: domain-access/, build-stages/, website-editing/, login-help/, escalation/

### Claude Tools Approach
- Give Claude tools to call (Trello lookup, ticket creation)
- Let Claude decide when to use them
- Stop pre-processing/pattern matching in our code
- "Claude in Control" — our code routes, Claude thinks

### Domain Access Flow
- We request ADMIN ACCESS, not login credentials
- GoDaddy uses "Delegate Access" — we send email invite
- Never ask for passwords
- Support email: websites@yourdocket.com
