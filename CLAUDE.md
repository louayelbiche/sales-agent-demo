# Sales Agent Demo

AI-powered sales email demo hosted at salesagent.runwellsystems.com

## Quick Reference

- **Port:** 3005 (local dev)
- **Spec:** `/Users/balencia/Documents/Code/claude-PM/projects/runwell-internal/specs/sales-agent-demo/`
- **Global Port Registry:** `/Users/balencia/Documents/Code/PORT-REGISTRY.md`

## Tech Stack

- Next.js 14+ (App Router)
- PostgreSQL via Prisma
- Resend for email
- Anthropic Claude for AI
- Cheerio + Puppeteer for scraping
- Tailwind CSS

## Commands

```bash
npm run dev          # Start dev server on port 3005
npm run build        # Production build
npx prisma studio    # Open Prisma database GUI
npx prisma migrate dev  # Run migrations
```

## Architecture

### User Flow
1. Email auth (magic link)
2. Input business website URL
3. System scrapes and analyzes brand
4. Create campaign (purpose + target)
5. Generate personalized emails
6. Preview and send to own inbox

### Key Directories
```
src/
├── app/              # Next.js App Router pages
│   ├── api/          # API routes
│   ├── auth/         # Auth pages
│   └── dashboard/    # Protected pages
├── components/       # React components
├── lib/              # Utilities
│   ├── prisma.ts     # Prisma client
│   ├── resend.ts     # Resend client
│   ├── claude.ts     # Claude API
│   ├── scraper.ts    # Website scraper
│   └── prompts/      # AI prompts
└── types/            # TypeScript types
```

### Database Models
- User - Email auth
- MagicToken - Auth tokens
- Session - User sessions
- Business - Website + brand analysis
- Campaign - Email campaign
- GeneratedEmail - Individual emails

## Environment Variables

See `.env.example` for required variables.

## Deployment

- **Target:** Hostinger VPS (72.62.121.234)
- **Domain:** salesagent.runwellsystems.com
- **CI/CD:** GitHub Actions
