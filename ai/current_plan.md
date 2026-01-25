# Current Plan

## Last Updated
January 24, 2026

## What's Complete
- Project restructured for Vercel + Neon stack
- Vercel serverless functions (api/verify.js, api/message.js, api/escalate.js)
- Neon database client (lib/db.js) with all SQL queries implemented
- Integration files moved to /lib (churnzero.js, trello.js, claude.js, email.js)
- Utility files moved to /lib (escalation.js, formatter.js)
- Frontend chat interface (index.html, styles.css, chat.js)
- Knowledge base structure (faq.json)
- Documentation updated for new stack

## What's Partially Done
- Nothing currently in progress

## What's Next
1. Test Vercel serverless functions locally with `vercel dev`
2. Verify Neon database connections work
3. Test full chat flow (verify → message → escalation)
4. Implement Trello integration (API key available)
5. Implement ChurnZero integration (API key pending — use mock data for now)
6. Deploy to Vercel and configure environment variables
7. Test deployed endpoints

## Known Issues / Blockers
- ChurnZero API key not yet available (expected in a few days)
- DNS for support.yourdocketonline.com not yet configured

## Notes
- Session handling is implemented — verify returns session_id, frontend stores it, message endpoint validates before processing
- All database queries converted from Supabase to Neon SQL with parameterized queries
- Frontend API calls use relative paths which work on Vercel
