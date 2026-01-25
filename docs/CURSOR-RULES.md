# Cursor Rules for Docket Support Bot

MANDATORY RULES FOR THIS PROJECT:

## PROJECT TYPE: Node.js + Express + Supabase
- Backend: Node.js with Express, serving both API and static frontend
- Database: Supabase (conversations, sessions, knowledge base)
- Integrations: ChurnZero API, Trello API, Claude API (Anthropic)
- Hosting: Railway (single deployment)
- Frontend: Simple HTML/CSS/JS chat widget (no React)

## DEVELOPER CONTEXT:
- Developer is familiar with web development but wants clear explanations
- Explain impact before making changes
- Keep things simple and maintainable
- Avoid over-engineering - this serves 50-80 users/month

## FILE STRUCTURE:
- /src/api - API route handlers
- /src/integrations - External API connections
- /src/db - Supabase client
- /src/utils - Helper functions
- /public - Frontend static files
- /knowledge-base - FAQ content
- /docs - Documentation

## KEY FILES:
- src/server.js - Express entry point
- src/api/message.js - Main chat endpoint
- src/api/verify.js - Email verification
- src/integrations/claude.js - AI response generation
- public/index.html - Chat interface
- public/chat.js - Frontend logic

## BEFORE MAKING CHANGES:
1. Explain WHAT you're changing
2. Explain WHY
3. Explain IMPACT on other parts
4. Ask for confirmation on multi-file changes

## CODING STANDARDS:
- Use vanilla JavaScript (no TypeScript)
- Use async/await for API calls
- Handle errors gracefully
- Comment complex logic
- Keep functions small and focused

## DO NOT:
- Add unnecessary dependencies
- Refactor unless asked
- Change unrelated code
- Use React or heavy frameworks
- Over-engineer solutions
- Add features not in the spec

## TESTING:
- Run npm run dev to test locally
- Test API endpoints with curl/Postman
- Check Supabase for data persistence

## DEPLOYMENT:
- Push to GitHub → Railway auto-deploys
- Environment variables in Railway dashboard
