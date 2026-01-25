# Project Structure

## Overview
Docket Support Bot - A client support chatbot that handles repetitive questions, pulls context from ChurnZero and Trello, and escalates to humans when needed.

## Directory Layout
```
/docket-support-bot
├── /docs                    # Documentation
├── /src                     # Backend source code
│   ├── /api                 # API route handlers
│   ├── /integrations        # External service connections
│   ├── /db                  # Database client and queries
│   └── /utils               # Helper functions
├── /public                  # Frontend static files
├── /knowledge-base          # FAQ and documentation content
└── Configuration files
```

## Core Components

### Backend (/src)

**server.js**
- Express app entry point
- Serves static files from /public
- Mounts API routes

**api/message.js**
- Main chat endpoint
- Receives messages, pulls context, generates responses
- Stores conversation history

**api/verify.js**
- Email verification endpoint
- Checks email against ChurnZero primary contact
- Creates verified session

**api/escalate.js**
- Handles escalation flow
- Sends email to Kayla with full context
- Updates conversation status

### Integrations (/src/integrations)

**churnzero.js**
- Get client by email
- Get recent activity/emails
- Get primary contact for verification

**trello.js**
- Get client's cards/projects
- Get project status and blockers

**claude.js**
- Generate AI responses
- Manages system prompt and context injection

**email.js**
- SendGrid integration
- Sends escalation emails

### Frontend (/public)

**index.html**
- Chat interface markup
- Email input form
- Message display area

**chat.js**
- Handles user input
- Sends/receives messages via API
- Manages UI state (loading, verified, escalated)

**styles.css**
- Chat widget styling
- Responsive design

### Database

**Supabase Tables:**
- conversations - Chat session records
- messages - Individual messages
- sessions - Verification sessions
- knowledge_base - FAQ content

## Data Flow

1. Client enters email → /api/verify checks ChurnZero → session created
2. Client sends message → /api/message receives it
3. Backend pulls ChurnZero + Trello context
4. Claude generates response with context
5. Response stored in Supabase, returned to client
6. If escalation triggered → /api/escalate sends email to Kayla
