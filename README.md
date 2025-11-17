# Whispa Monorepo

A modern, full-stack monorepo built with Turborepo, featuring a TanStack Start frontend, Bun backend, and shared Drizzle database layer.

## Tech Stack

- **Package Manager**: Bun
- **Monorepo**: Turborepo
- **Linting/Formatting**: Biome (single tool for both)
- **Database ORM**: Drizzle
- **Git Hooks**: Lefthook
- **Frontend**: TanStack Start (React Router + Vite)
- **Backend**: Bun runtime

## Project Structure

```
whispa/
├── apps/
│   ├── web/              # TanStack Start frontend app
│   ├── backend/          # Bun backend server
│   └── docs/             # Next.js documentation site
├── packages/
│   ├── db/               # Shared Drizzle database package
│   ├── ui/               # Shared React components
│   └── typescript-config/# Shared TypeScript configs
└── turbo.json            # Turborepo configuration
```

## Prerequisites

- [Bun](https://bun.sh) v1.3.0 or higher
- PostgreSQL database (for development)

## Getting Started

### 1. Install Dependencies

```bash
bun install
```

This will:
- Install all dependencies across the monorepo
- Setup lefthook git hooks automatically

### 2. Environment Setup

Create `.env` files in the necessary packages:

```bash
# Root .env (if needed)
cp .env.example .env

# Database package
cd packages/db
cp .env.example .env
```

Update `packages/db/.env` with your database credentials:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/whispa
```

### 3. Database Setup

Generate and run migrations:

```bash
# Generate migrations from schema
bun run db:generate

# Push schema to database (development)
bun run db:push

# Or run migrations (production)
cd packages/db
bun run db:migrate
```

Open Drizzle Studio to view your database:
```bash
cd packages/db
bun run db:studio
```

### 4. Development

Start all apps in development mode:

```bash
bun run dev
```

Or run specific apps:

```bash
# Web app only (port 3000)
turbo dev --filter=@whispa/web

# Backend only
turbo dev --filter=@whispa/backend

# Docs only (port 3001)
turbo dev --filter=docs
```

## Available Scripts

### Root Commands

```bash
# Development
bun run dev              # Start all apps in dev mode

# Building
bun run build            # Build all apps and packages
bun run build --filter=@whispa/web  # Build specific app

# Code Quality
bun run lint             # Lint and auto-fix with Biome
bun run lint:check       # Lint without auto-fix (CI mode)
bun run format           # Format code with Biome
bun run check-types      # Type check all packages
bun run test             # Run all tests
```

### Package-Specific Commands

#### Web App (`apps/web`)
```bash
cd apps/web
bun run dev              # Start dev server on port 3000
bun run build            # Build for production
bun run serve            # Preview production build
bun run test             # Run tests with Vitest
bun run lint             # Lint web app
bun run check-types      # Type check
```

#### Backend (`apps/backend`)
```bash
cd apps/backend
bun run dev              # Start with hot reload
bun run build            # Build for production
bun run start            # Run production build
bun run test             # Run tests with Bun test
bun run lint             # Lint backend
bun run check-types      # Type check
```

#### Database (`packages/db`)
```bash
cd packages/db
bun run db:generate      # Generate migrations from schema
bun run db:push          # Push schema to database (dev)
bun run db:pull          # Pull schema from database
bun run db:migrate       # Run migrations
bun run db:studio        # Open Drizzle Studio
bun run test             # Run database tests
```

## Code Quality & Git Hooks

### Biome Configuration

This project uses [Biome](https://biomejs.dev) for both linting and formatting (replacing ESLint + Prettier).

- Auto-fixes on save in VS Code (see `.vscode/settings.json`)
- Organizes imports automatically
- Enforces consistent code style

### Pre-commit Hooks (Lefthook)

Automatically runs on `git commit`:
- **Lint**: Runs Biome on staged files and auto-fixes issues
- **Type Check**: Runs TypeScript type checking on changed packages

### Pre-push Hooks

Automatically runs on `git push`:
- **Tests**: Runs tests on changed packages
- **Build**: Builds changed packages to ensure they compile

To skip hooks (not recommended):
```bash
git commit --no-verify
```

## Testing

This monorepo uses different test runners optimized for each environment:

- **Web App**: Vitest (integrates with Vite)
- **Backend**: Bun test (native Bun testing)
- **Database**: Bun test (framework-agnostic)

Run all tests:
```bash
bun run test
```

Run tests for specific package:
```bash
turbo test --filter=@whispa/web
```

## Database Management

### Schema Changes

1. Update schema in `packages/db/src/schema/index.ts`
2. Generate migration:
   ```bash
   cd packages/db
   bun run db:generate
   ```
3. Review generated migration in `packages/db/drizzle/`
4. Apply migration:
   ```bash
   bun run db:migrate
   ```

### Using the Database in Your App

```typescript
import { db, users } from "@whispa/db";

// Query users
const allUsers = await db.select().from(users);

// Insert user
const newUser = await db.insert(users).values({
  name: "John Doe",
  email: "john@example.com",
}).returning();
```

## Building for Production

Build all apps and packages:

```bash
bun run build
```

Build specific app:

```bash
turbo build --filter=@whispa/web
```

Output locations:
- **Web**: `apps/web/.output/`
- **Backend**: `apps/backend/dist/`
- **Docs**: `apps/docs/.next/`

## Turborepo Features

### Caching

Turborepo automatically caches build outputs and test results. This means:
- Rebuilding unchanged packages is instant
- Tests for unchanged code are skipped
- You can share cache with your team via Remote Caching

### Filtering

Run tasks for specific packages:

```bash
# Run dev for web app only
turbo dev --filter=@whispa/web

# Run build for backend and its dependencies
turbo build --filter=@whispa/backend...

# Run lint for all changed packages since main
turbo lint --filter=...[origin/main]
```

### Remote Caching (Optional)

Enable remote caching with Vercel:

```bash
bunx turbo login
bunx turbo link
```

## Project Conventions

### Package Naming

- Apps: `@whispa/[name]` (e.g., `@whispa/web`, `@whispa/backend`)
- Packages: `@whispa/[name]` (e.g., `@whispa/db`)
- Shared configs: `@repo/[name]` (e.g., `@repo/ui`)

### Code Style

- **Indentation**: Tabs
- **Quotes**: Double quotes
- **Line Endings**: LF (Unix)
- **Imports**: Auto-organized by Biome

### File Naming

- React components: PascalCase (`MyComponent.tsx`)
- Utilities: camelCase (`myUtil.ts`)
- Tests: `*.test.ts` or `*.test.tsx`

## Troubleshooting

### Database Connection Issues

1. Verify PostgreSQL is running
2. Check `DATABASE_URL` in `packages/db/.env`
3. Ensure database exists:
   ```bash
   psql -U postgres -c "CREATE DATABASE whispa;"
   ```

### Type Errors

1. Ensure all dependencies are installed: `bun install`
2. Run type check: `bun run check-types`
3. Check for missing `@types/*` packages

### Lefthook Not Running

1. Reinstall hooks: `bunx lefthook install`
2. Check `.git/hooks/` directory exists
3. Verify hooks are executable

### Biome VS Code Extension

Install the [Biome VS Code extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome):

```bash
code --install-extension biomejs.biome
```

## Useful Links

### Turborepo
- [Tasks](https://turborepo.com/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.com/docs/crafting-your-repository/caching)
- [Filtering](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters)

### Tools
- [Bun Documentation](https://bun.sh/docs)
- [Drizzle ORM](https://orm.drizzle.team/docs/overview)
- [TanStack Start](https://tanstack.com/start)
- [Biome](https://biomejs.dev)
- [Lefthook](https://lefthook.dev)

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Ensure all checks pass: `bun run lint && bun run check-types && bun run test`
4. Commit your changes (hooks will run automatically)
5. Push and create a pull request

## License

[Your License Here]
