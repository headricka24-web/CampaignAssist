# Quick Start

## Prerequisites
- Node.js 18+
- An Anthropic API key

## Steps

```bash
cd ~/Desktop/campaign-assist

# 1. Copy env and add your key
cp .env.example .env
# Edit .env → set ANTHROPIC_API_KEY=sk-ant-...

# 2. Install dependencies
npm install

# 3. Generate Prisma client + create SQLite DB
npx prisma migrate dev --name init

# 4. (Optional) seed sample data
npm run db:seed

# 5. Start dev server
npm run dev
```

Open http://localhost:3000

## First steps in the app
1. Go to **Settings** → add a Candidate and an Outlet
2. Go to **News** → paste an article URL, title, and body text → click Ingest & Classify
3. View classified articles on the Dashboard
4. Go to **Briefing** → create a Bin from articles → generate a DailyDigest
