# Docket Support Bot

Client support chatbot for Docket website clients. Handles common questions, pulls context from ChurnZero and Trello, escalates to humans when needed.

## Features
- Chat widget for client support
- Email verification against ChurnZero
- Context-aware responses using client history
- Automatic escalation to Kayla for complex issues
- Knowledge base for FAQ responses

## Stack
- Node.js + Express
- Supabase (database)
- Claude API (AI responses)
- ChurnZero & Trello APIs (client context)
- SendGrid (escalation emails)
- Railway (hosting)

## Setup
See [docs/QUICK-START.md](docs/QUICK-START.md)

## Documentation
- [Project Structure](docs/PROJECT-STRUCTURE.md)
- [Quick Start](docs/QUICK-START.md)
- [Cursor Rules](docs/CURSOR-RULES.md)

## Environment Variables
Copy `.env.example` to `.env` and fill in your API keys.

## License
Private - Docket Internal Use
