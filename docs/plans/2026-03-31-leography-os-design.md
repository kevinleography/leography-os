# LEOGRAPHY OS — Design Document

## Stack
- Next.js 15 (App Router, Server Components)
- TypeScript 5, Tailwind CSS 4 + shadcn/ui
- Supabase SSR (@supabase/ssr) for auth + realtime
- Recharts, TipTap, dnd-kit, Motion (Framer)

## Architecture
- Monolith Next.js with API Routes
- Dark glassmorphism theme with Apple-style Dock
- 10 modules: Dashboard, CRM, Pipeline, Audit IA, Projects, Notes IA, Finance, Ads, Messages, Settings
- Client portal and public audit sharing
- Supabase for DB/auth, Claude API for AI features, n8n for automation

## Approved: 2026-03-31
