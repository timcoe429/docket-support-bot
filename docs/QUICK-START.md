# Quick Start Guide

## Prerequisites
- Node.js 18+
- Neon account (free tier available)
- API keys for: ChurnZero, Trello, Anthropic (Claude), SendGrid
- Vercel account (free tier available)

## Local Setup

### 1. Clone and Install
```bash
git clone https://github.com/[your-repo]/docket-support-bot.git
cd docket-support-bot
npm install
```

### 2. Environment Variables
Copy .env.example to .env and fill in your keys:
```bash
cp .env.example .env
```

Required variables:
- DATABASE_URL (Neon connection string)
- CHURNZERO_API_KEY
- CHURNZERO_APP_KEY
- TRELLO_API_KEY
- TRELLO_TOKEN
- ANTHROPIC_API_KEY
- SENDGRID_API_KEY
- ESCALATION_EMAIL

### 3. Neon Database Setup
Run these SQL commands in your Neon SQL editor:
```sql
-- Conversations table
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active',
  escalation_reason TEXT
);

-- Messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  context_used JSONB
);

-- Sessions table
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_email TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Knowledge base table
CREATE TABLE knowledge_base (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  keywords TEXT[]
);
```

### 4. Run Locally
```bash
npm run dev
```
App runs at http://localhost:3000 (Vercel dev server)

### 5. Test the Flow
1. Open http://localhost:3000
2. Enter a test email
3. Send a message
4. Check Neon database tables for data

## Deployment (Vercel)

1. Push code to GitHub
2. Import project in Vercel dashboard
3. Connect to your GitHub repo
4. Add environment variables in Vercel project settings
5. Deploy (automatic on push to main branch)
6. Point support.yourdocketonline.com DNS to Vercel URL

## Adding Knowledge Base Content

Edit /knowledge-base/faq.json or insert directly into Neon database:
```json
{
  "question": "How do I update my business hours?",
  "answer": "Log into your dashboard, go to Settings > Business Info, and update your hours there. Here's a guide: [link]",
  "category": "dashboard",
  "keywords": ["hours", "business hours", "update hours", "change hours"]
}
```
