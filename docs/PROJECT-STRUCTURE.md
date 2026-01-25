# Project Structure

## Overview
Docket Support Bot - A client support chatbot that handles repetitive questions, pulls context from ChurnZero and Trello, and escalates to humans when needed.

## Directory Layout
```
/docket-support-bot
├── /api                    # Vercel serverless functions
│   ├── message.js          # POST /api/message
│   ├── verify.js           # POST /api/verify
│   └── escalate.js         # POST /api/escalate
├── /lib                    # Shared code
│   ├── db.js               # Neon database client
│   ├── churnzero.js        # ChurnZero integration
│   ├── trello.js           # Trello integration
│   ├── claude.js           # Claude API integration
│   ├── email.js            # SendGrid integration
│   ├── escalation.js       # Escalation detection logic
│   └── formatter.js        # Helper formatting functions
├── /public                 # Frontend static files
├── /knowledge-base         # FAQ and documentation content
├── /docs                   # Documentation
├── /ai                     # AI context and planning docs
└── Configuration files
```

## Core Components

### Backend (/api)

**api/verify.js**
- Email verification endpoint (Vercel serverless function)
- Checks email against ChurnZero primary contact
- Creates verified session

**api/message.js**
- Main chat endpoint (Vercel serverless function)
- Receives messages, pulls context, generates responses
- Stores conversation history

**api/escalate.js**
- Escalation endpoint (Vercel serverless function)
- Sends email to Kayla with full context
- Updates conversation status

### Shared Code (/lib)

**db.js**
- Neon database client
- Database helper functions (conversations, messages, sessions, knowledge base)

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

**escalation.js**
- Escalation keyword detection
- Sentiment analysis
- Profanity detection

**formatter.js**
- Context formatting utilities
- Date formatting helpers

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

**Neon Postgres Tables:**
- conversations - Chat session records
- messages - Individual messages
- sessions - Verification sessions
- knowledge_base - FAQ content

## Data Flow

1. Client enters email → /api/verify checks ChurnZero → session created
2. Client sends message → /api/message receives it
3. Backend pulls ChurnZero + Trello context
4. Claude generates response with context
5. Response stored in Neon, returned to client
6. If escalation triggered → /api/escalate sends email to Kayla
