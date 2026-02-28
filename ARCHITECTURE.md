# FlowTrack Architecture Guide

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js 16 App Router                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────┐          ┌──────────────────────┐    │
│  │  Server Components   │          │ Client Components    │    │
│  │  (Data Fetching)     │          │ (Interactivity)      │    │
│  │                      │          │                      │    │
│  │  - /app/page.tsx     │          │  - DashboardLayout   │    │
│  │  - /app/tasks/...    │          │  - KPICard           │    │
│  │  - Async functions   │          │  - Charts            │    │
│  └──────────┬───────────┘          └──────────┬───────────┘    │
│             │                                  │                 │
└─────────────┼──────────────────────────────────┼─────────────────┘
              │                                  │
              │ Fetches data                    │ Uses data
              ▼                                  ▼
┌────────────────────────────────────────────────────────┐
│              Middleware Layer (lib/)                    │
├────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────┐  ┌─────────────────────────┐ │
│  │  lib/analytics/      │  │  lib/queries/           │ │
│  │  - metrics.ts        │  │  - tasks.ts             │ │
│  │                      │  │  - revenue.ts           │ │
│  │ Calculations:        │  │  - activity.ts          │ │
│  │ - KPI generation     │  │                         │ │
│  │ - Metrics            │  │ Query functions:        │ │
│  │ - Aggregations       │  │ - get, create, update   │ │
│  │                      │  │ - Filters & validation  │ │
│  └──────────┬───────────┘  └───────┬─────────────────┘ │
│             │                       │                    │
│             └───────────┬───────────┘                    │
│                         │                                │
│             ┌───────────▼────────────┐                  │
│             │  lib/supabase/         │                  │
│             │  - server.ts           │                  │
│             │  - client.ts           │                  │
│             │                        │                  │
│             │ Centralized clients:   │                  │
│             │ - Consistent creation  │                  │
│             │ - Error handling       │                  │
│             │ - Type safety          │                  │
│             └───────────┬────────────┘                  │
│                         │                               │
│             ┌───────────▼────────────┐                  │
│             │  lib/types/            │                  │
│             │  - index.ts            │                  │
│             │                        │                  │
│             │ Type definitions:      │                  │
│             │ - Task, Revenue, etc.  │                  │
│             │ - KPIMetrics, Filters  │                  │
│             │ - No any types         │                  │
│             └────────────────────────┘                  │
│                                                          │
└──────────────────────────┬───────────────────────────────┘
                           │
                           │ Connects to
                           ▼
                  ┌────────────────────┐
                  │  Supabase (Cloud)  │
                  │                    │
                  │ - tasks table      │
                  │ - revenue table    │
                  │ - team_members     │
                  │ - activity_logs    │
                  └────────────────────┘
```

## Data Flow Patterns

### Pattern 1: Server Component Data Fetching (Recommended)

```typescript
// app/page.tsx (Server Component)
export default async function Dashboard() {
  // Fetch all data at server level
  const [metrics, revenue] = await Promise.all([
    generateKPIMetrics(),
    getMonthlyRevenue(),
  ]);

  return <DashboardContent kpi={metrics} revenue={revenue} />;
}
```

**Flow:**
1. Server fetches data from lib/analytics and lib/queries
2. Data is passed to client components
3. Client renders with data (no useEffect)
4. No loading states needed

### Pattern 2: Client Component with API Routes

```typescript
// Client component that needs dynamic data
'use client';

useEffect(() => {
  fetch('/api/tasks')
    .then(r => r.json())
    .then(data => setTasks(data));
}, []);
```

**Flow:**
1. Page loads, client component renders
2. useEffect triggers API call
3. API Route calls query functions
4. Data flows back to component
5. Component re-renders with data

## Key Design Decisions

### 1. Server Components for Initial Data
- **Why:** Faster page loads, less JavaScript sent to browser
- **When:** Use for dashboard, reports, lists
- **Example:** Dashboard page fetches KPI metrics server-side

### 2. Client Components for Interactions
- **Why:** Only these need state, event handlers
- **When:** Forms, modals, filters
- **Example:** Task modal, table filters

### 3. Query Layer Abstraction
- **Why:** Centralized data access, easier testing, DRY principle
- **Benefit:** Change Supabase later without touching components
- **Location:** `lib/queries/*`

### 4. Metrics Calculation Layer
- **Why:** Separate business logic from UI
- **Benefit:** Reusable, testable, cacheable
- **Location:** `lib/analytics/metrics.ts`

### 5. Centralized Client Management
- **Why:** Prevent multiple Supabase instances
- **Location:** `lib/supabase/*`
- **Benefit:** Consistent error handling, configuration

## File Organization Rationale

```
lib/
├── types/           # Shared interfaces (no circular deps)
├── supabase/        # Lowest level (only imports types)
├── queries/         # Query layer (imports supabase, types)
└── analytics/       # Calculations (imports queries, types)

app/
├── page.tsx         # Server component (imports queries, analytics)
├── tasks/           # Feature folder
│   ├── page.tsx     # Client component (imports queries)
│   └── components/  # Task-specific components
└── api/
    └── tasks/       # Optional API routes for client-side fetching
```

## Dependency Direction

```
Types
  ↑
  │
Supabase ──→ Types
  ↑
  │
Queries ────→ Supabase, Types
  ↑
  │
Analytics ──→ Queries, Supabase, Types
  ↑
  │
Pages ──────→ Analytics, Queries, Types
  ↑
  │
Components ─→ Everything above
```

**Rule:** Always depend downward, never upward.

## Error Handling Strategy

### Level 1: Database Errors (lib/supabase)
```typescript
if (error) {
  console.error('DB error:', error.message);
  return { data: null, error: error.message };
}
```

### Level 2: Query Errors (lib/queries)
```typescript
// Validate inputs
if (!task.title) {
  return { data: null, error: 'Title is required' };
}
```

### Level 3: Component Errors (Components)
```typescript
if (error) {
  setError(message);
  // Show error banner to user
}
```

## Type Safety Progression

```typescript
// ✅ GOOD: Strongly typed
const result = await getTasks(); // Returns { data: Task[] | null; error: string | null }
type TaskStatus = 'pending' | 'active' | 'completed'; // Literal types

// ❌ BAD: Loosely typed
const result = await getTasks(); // Returns any
type TaskStatus = string; // Too generic
```

## Performance Considerations

### Server-Side Optimizations
- ✅ Parallel data fetching with `Promise.all()`
- ✅ Filter/aggregate data before sending to client
- ✅ Cache static content with metadata

### Client-Side Optimizations
- ✅ Only send necessary data to browser
- ✅ Use components sparingly
- ✅ Memoize expensive calculations
- ✅ Lazy-load charts with React.lazy()

### Database Optimizations
- ✅ Select specific columns, not `SELECT *`
- ✅ Use indexes on frequently filtered columns
- ✅ Limit query results with `.limit()`
- ✅ Order results efficiently

## Testing Strategy

### Unit Tests: lib/
```typescript
// lib/analytics/metrics.test.ts
describe('generateKPIMetrics', () => {
  it('calculates correct completion rate', async () => {
    const metrics = await generateKPIMetrics();
    expect(metrics.completionRate).toBeLessThanOrEqual(100);
  });
});
```

### Integration Tests: app/
```typescript
// app/__tests__/page.test.tsx
describe('Dashboard', () => {
  it('renders KPI cards with data', async () => {
    const page = await Dashboard();
    expect(page).toContain('Total Revenue');
  });
});
```

## Scaling Considerations

### When to Add Caching
```typescript
// lib/analytics/metrics.ts
export async function generateKPIMetrics() {
  // Add Redis caching here if metrics calculated too frequently
  const cached = await redis.get('kpi-metrics');
  if (cached) return cached;
  
  const result = await calculateMetrics();
  await redis.setex('kpi-metrics', 300, result); // 5 min cache
  return result;
}
```

### When to Optimize Queries
```typescript
// Monitor query performance
// If slow:
// 1. Add database indexes
// 2. Select fewer columns
// 3. Use aggregations in database, not application
// 4. Cache results
```

### When to Use Pagination
```typescript
// lib/queries/tasks.ts
export async function getTasks(limit = 10, offset = 0) {
  return serverQuery(async (client) => {
    return client
      .from('tasks')
      .select('*')
      .range(offset, offset + limit - 1);
  });
}
```

## Future Improvements

1. **Add authentication** - Secure queries with user_id
2. **Add real-time updates** - Supabase subscriptions
3. **Add caching layer** - Redis for frequent queries
4. **Add rate limiting** - Protect API endpoints
5. **Add monitoring** - Track query performance
6. **Add tests** - Unit and integration tests

## Reference

- Next.js Docs: https://nextjs.org/docs
- Supabase Client: https://supabase.com/docs/reference/javascript
- TypeScript: https://typescriptlang.org/docs
