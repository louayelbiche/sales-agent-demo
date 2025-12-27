# Sales Agent Demo

AI-powered sales email demo that analyzes your brand and generates personalized outreach.

**Live Demo:** https://sales.runwellsystems.com

## Features

- **Email-only Auth**: Sign in with magic link (no password)
- **Brand Analysis**: Scrapes your website and extracts brand voice using Claude
- **Campaign Creation**: Define purpose and target audience
- **Email Generation**: AI generates personalized emails matching your brand
- **Send to Inbox**: Preview and send emails to yourself

## Tech Stack

- Next.js 14+ (App Router)
- PostgreSQL + Prisma
- Anthropic Claude API
- Resend for emails
- Tailwind CSS

## Getting Started

1. Clone and install:
```bash
git clone https://github.com/louayelbiche/sales-agent-demo.git
cd sales-agent-demo
npm install
```

2. Set up environment:
```bash
cp .env.example .env.local
# Edit .env.local with your API keys
```

3. Initialize database:
```bash
npm run db:push
```

4. Run development server:
```bash
npm run dev
```

Open [http://localhost:3005](http://localhost:3005)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | Claude API key |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` | Sender email address |
| `NEXT_PUBLIC_APP_URL` | App URL for magic links |

## Port

This project uses **port 3005** per the [Global Port Registry](/Users/balencia/Documents/Code/PORT-REGISTRY.md).

## Spec

Full product spec: `/claude-PM/projects/runwell-internal/specs/sales-agent-demo/`

---

Powered by [RunWell Systems](https://runwellsystems.com)
