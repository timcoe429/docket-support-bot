# Cursor Rules for Docket Support Bot

MANDATORY RULES FOR THIS PROJECT:

## PROJECT TYPE: Vercel Serverless + Neon
- Hosting: Vercel (serverless functions for API, static for frontend)
- Database: Neon (serverless Postgres)
- Integrations: ChurnZero API, Trello API, Claude API (Anthropic)
- Frontend: Simple HTML/CSS/JS chat widget (no React)
- No Express - each API route is a standalone serverless function

## DEVELOPER CONTEXT:
- Developer is familiar with web development but wants clear explanations
- Explain impact before making changes
- Keep things simple and maintainable
- Avoid over-engineering - this serves 50-80 users/month

## FILE STRUCTURE:
- /api - Vercel serverless functions
- /lib - Shared code (database, integrations, utilities)
- /public - Frontend static files
- /knowledge-base - FAQ content
- /docs - Documentation

## KEY FILES:
- api/message.js - Main chat endpoint (Vercel serverless function)
- api/verify.js - Email verification (Vercel serverless function)
- lib/db.js - Neon database client
- lib/claude.js - AI response generation
- public/index.html - Chat interface
- public/chat.js - Frontend logic

## BEFORE MAKING CHANGES:
1. Explain WHAT you're changing
2. Explain WHY
3. Explain IMPACT on other parts
4. Ask for confirmation on multi-file changes

## CODING STANDARDS:
- Use vanilla JavaScript (no TypeScript)
- Use ES modules (import/export)
- Use async/await for API calls
- Handle errors gracefully
- Comment complex logic
- Keep functions small and focused
- Use parameterized SQL queries with Neon's tagged template literals

## DO NOT:
- Add unnecessary dependencies
- Refactor unless asked
- Change unrelated code
- Use React or heavy frameworks
- Over-engineer solutions
- Add features not in the spec
- Use dotenv.config() in individual files (Vercel handles env vars)

## TESTING:
- Run `npm run dev` (uses `vercel dev`) to test locally
- Test API endpoints with curl/Postman
- Check Neon database for data persistence

## DEPLOYMENT:
- Push to GitHub → Vercel auto-deploys
- Environment variables in Vercel project settings
