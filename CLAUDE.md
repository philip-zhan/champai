# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build production application with Turbopack
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint on the codebase

## Database Commands

- `pnpm db:generate` - Generate Drizzle schema files
- `pnpm db:migrate` - Run database migrations
- `pnpm db:push` - Push schema changes to database
- `pnpm db:drop` - Drop database tables

## Project Architecture

This is a Next.js 15 application that integrates with Zendesk to sync and manage tickets. Key architectural components:

### Core Technologies
- **Next.js 15** with App Router and Turbopack
- **PostgreSQL** database with Drizzle ORM
- **TanStack Query** for client-side data management
- **Tailwind CSS** for styling
- **TypeScript** with strict configuration

### Database Architecture
- Uses Drizzle ORM with PostgreSQL
- Main entities: `tickets` and `ticketComments`
- Database configuration in `src/db/index.ts`
- Schema definitions in `src/db/schema/`
- CRUD operations in `src/db/crud/`

### Zendesk Integration
- API client using `openapi-fetch` with generated types
- Rate limiting and pagination handling
- Incremental sync of tickets and ticket events
- Main integration logic in `src/lib/zendesk.ts`

### Application Structure
- **Server Actions**: `src/app/actions.ts` for Zendesk sync operations
- **API Routes**: 
  - `src/app/api/tickets/route.ts` - Main tickets API
  - `src/app/api/tickets/filter-values/route.ts` - Filter values
- **Components**: React components in `src/app/components/`
  - `TicketsTableClient` - Main tickets display
  - `TicketsFilters` - Filtering interface
  - `SearchBox` - Search functionality
  - `ZendeskSyncForm` - Sync trigger interface

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `ZENDESK_BASE_URL` - Zendesk instance URL
- `ZENDESK_TOKEN` - Zendesk API bearer token

### Key Features
- Incremental ticket sync from Zendesk
- Rate limiting compliance with Zendesk API
- Filterable and searchable ticket interface
- Real-time UI updates via TanStack Query

## Type Safety
- Uses generated TypeScript types from Zendesk OpenAPI spec (`src/lib/zendesk-schema.d.ts`)
- Strict TypeScript configuration with `noUncheckedIndexedAccess`
- Path aliases configured for `@/*` pointing to `src/*`

## Database Migrations
Run migrations before development: `pnpm db:migrate`
Schema changes require running: `pnpm db:generate` then `pnpm db:push`