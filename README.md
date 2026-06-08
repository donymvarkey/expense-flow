# ExpenseFlow

A modern, mobile-first Progressive Web App for personal expense tracking. Built with React 19, TypeScript, Tailwind CSS, and Supabase. Works offline using IndexedDB with automatic sync.

## Features

- **Offline-First** — Add, edit, and view transactions without internet. Data syncs automatically when back online.
- **Quick Add** — Add expenses in under 5 seconds with a large numpad and fast category selection.
- **Receipt Scanning** — Capture receipts with your camera. OCR extracts amount, merchant, and date automatically.
- **Budget Management** — Set monthly category budgets with real-time progress tracking.
- **Analytics** — Monthly trends, income vs expense charts, and category breakdowns.
- **PWA** — Installable on any device. Launches like a native app with offline caching.
- **Dark Mode** — Elegant dark UI by default.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS v4 |
| UI Components | Custom (shadcn/ui-inspired) |
| State | React Hook Form, TanStack Query |
| Backend | Supabase (Auth, PostgreSQL, Storage) |
| Offline DB | IndexedDB via Dexie.js |
| PWA | vite-plugin-pwa + Workbox |
| Charts | Recharts |
| OCR | Tesseract.js |
| Icons | Lucide React |
| Validation | Zod |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Setup

1. Clone and install:
```bash
cd ExpenseFlow
npm install
```

2. Create a `.env` file:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

3. Run the database schema in your Supabase SQL editor:
```
supabase/schema.sql
```

4. Start development:
```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── ui/            # Reusable UI primitives
│   ├── layout/        # App shell, nav, FAB
│   └── common/        # Shared components
├── features/
│   ├── auth/          # Login, register, forgot password
│   ├── dashboard/     # Main dashboard
│   ├── transactions/  # CRUD, quick add, list
│   ├── analytics/     # Charts and insights
│   ├── budgets/       # Budget management
│   ├── categories/    # Category management
│   ├── profile/       # User profile, settings
│   └── receipts/      # Receipt scanning (OCR)
├── hooks/             # Custom React hooks
├── services/          # Data access layer
├── db/                # IndexedDB (Dexie) setup
├── sync/              # Offline sync engine
├── lib/               # Supabase client, utilities
├── types/             # TypeScript types
└── styles/            # Global CSS
```

## Offline Architecture

All data operations write to IndexedDB first (optimistic updates), then queue changes for Supabase sync:

1. User action → Write to IndexedDB → Display immediately
2. Queue sync operation → Attempt server sync
3. On success → Mark as synced
4. On failure → Retry with exponential backoff (max 5 attempts)
5. On network restore → Process entire queue

## Database Schema

See `supabase/schema.sql` for the complete schema including:
- Row Level Security policies (user data isolation)
- Indexes for performance
- Storage bucket for receipt images
- Auto-update triggers

## PWA Installation

The app is installable on:
- **Android**: Chrome → "Add to Home Screen"
- **iOS**: Safari → Share → "Add to Home Screen"
- **Desktop**: Chrome address bar install icon

## License

MIT
