# Current Plan

## Completed This Session
- ✅ Fixed Trello Board ID (was missing from env vars)
- ✅ Added welcome screen with 4 category buttons (Website Build Status, Edits, Login, Something Else)
- ✅ Green hover effects on category buttons (#7eb10f)
- ✅ Category-specific greetings when chat starts
- ✅ Fixed welcome screen sizing (was too small)
- ✅ Removed quick action buttons (were showing irrelevant options)
- ✅ Updated Claude system prompt (multiple iterations)
- ✅ Added debug logging for Trello lookups

## Current Issue
Trello lookup uses dumb pattern matching instead of letting Claude decide. When user says "GoDaddy" (their registrar), our code searches Trello for "GoDaddy" as a company name. Claude knows GoDaddy is a registrar, but our code doesn't let Claude make that call.

## Next Up: New Architecture
Moving to "Claude in Control" approach:

### Phase 1: Knowledge Base
- Create `/knowledge` folder with markdown docs
- Folders: domain-access, build-stages, website-editing, login-help, escalation
- Docs are editable via GitHub by team
- Build loader that pulls relevant docs by category

### Phase 2: Claude Tools
- Give Claude a `lookup_project` tool (searches Trello)
- Claude decides when to call it (not our code guessing)
- Later: `create_ticket` tool for escalation

### Phase 3: Simplify
- Strip system prompt to just personality/tone
- Remove all pattern matching logic
- Let Claude be Claude

## Blocked On
Nothing — ready to build Phase 1

## Files Modified This Session
- /public/index.html (welcome screen with category buttons)
- /public/styles.css (category button styles, sizing)
- /public/chat.js (category handlers, startChatWithCategory, removed quick actions)
- /api/message.js (category param, debug logging)
- /lib/claude.js (system prompt updates, debug logging)
