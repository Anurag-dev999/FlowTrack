# FlowTrack - Developer Best Practices

## Code Patterns to Follow

### 1. Creating New Query Functions

```typescript
// lib/queries/example.ts

import { serverQuery } from '@/lib/supabase/server';
import { SomeType } from '@/lib/types';

// ✅ GOOD: Focused, documented, error-handled
export async function getSomething(id: string): Promise<{
  data: SomeType | null;
  error: string | null;
}> {
  // Input validation
  if (!id) {
    return { data: null, error: 'ID is required' };
  }

  // Use serverQuery wrapper for consistent error handling
  return serverQuery<SomeType>(async (client) => {
    return client.from('table').select('*').eq('id', id).single();
  });
}

// ❌ BAD: Raw client usage, no validation, inconsistent
export async function getSomethingBad(id: string) {
  const client = createClient(...);
  const { data, error } = await client.from('table').select('*');
  return data; // No error handling
}
```

### 2. Creating New Metrics/Calculations

```typescript
// lib/analytics/metrics.ts

// ✅ GOOD: Pure function, well-documented, typed
export async function calculateSomething(): Promise<number> {
  try {
    const client = getSupabaseServerClient();
    const { data, error } = await client
      .from('table')
      .select('amount');

    if (error) {
      console.error('Error calculating:', error.message);
      return 0;
    }

    return data.reduce((sum, record) => sum + record.amount, 0);
  } catch (err) {
    console.error('Unexpected error:', err);
    return 0;
  }
}

// ❌ BAD: Async logic in component, no error handling
export async function calculateSomethingBad() {
  const { data } = await client.from('table').select('amount');
  return data.reduce((sum, r) => sum + r.amount, 0);
}
```

### 3. Using Queries in Server Components

```typescript
// app/my-page/page.tsx

// ✅ GOOD: Server component, fetching at page level, parallel execution
export default async function MyPage() {
  // Fetch all data in parallel
  const [result1, result2] = await Promise.all([
    getSomething(),
    getSomethingElse(),
  ]);

  // Handle errors gracefully
  const data1 = result1.data || fallbackValue;
  const data2 = result2.data || fallbackValue;

  return <Component data1={data1} data2={data2} />;
}

// ❌ BAD: Client component, useEffect fetching, sequential queries
'use client';

export default function MyPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/something')
      .then(r => r.json())
      .then(setData);
  }, []);

  return <Component data={data} />;
}
```

### 4. Using Queries in Client Components

```typescript
// app/my-feature/page.tsx
'use client';

// ✅ GOOD: Separate concerns, proper error handling
import { useEffect, useState } from 'react';

export default function MyFeature() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/endpoint');
        if (!response.ok) throw new Error('Failed to fetch');
        const result = await response.json();
        setData(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorBanner message={error} />;
  if (!data) return <EmptyState />;

  return <Content data={data} />;
}

// ❌ BAD: No error states, no loading state
useEffect(() => {
  fetch('/api/endpoint').then(r => r.json()).then(setData);
}, []);
```

### 5. Form Validation

```typescript
// ✅ GOOD: Client-side validation + server-side validation
'use client';

import { createTask } from '@/lib/queries/tasks';

export function TaskForm() {
  const handleSubmit = async (formData: FormData) => {
    // Client-side validation
    const title = formData.get('title') as string;
    if (!title?.trim()) {
      setError('Title is required');
      return;
    }

    // Server-side operation (via Server Action or API)
    const result = await createTask({
      title: title.trim(),
      // ... other fields
    });

    if (result.error) {
      setError(result.error);
      return;
    }

    // Success
    setData(result.data);
  };
}

// ❌ BAD: No validation, silent failures
async function handleSubmit(data: any) {
  const res = await fetch('/api/tasks', { method: 'POST', body: JSON.stringify(data) });
  setTasks([...tasks, await res.json()]);
}
```

### 6. Type Usage

```typescript
// ✅ GOOD: Strongly typed, no any
import { Task, TaskStatus } from '@/lib/types';

export function TaskCard({ task }: { task: Task }) {
  const handleStatusChange = (status: TaskStatus) => {
    // TypeScript ensures valid status values
    updateTask(task.id, { status });
  };

  return <div>{task.title} - {task.status}</div>;
}

// ❌ BAD: Loosely typed, uses any
export function TaskCard({ task }: { task: any }) {
  const handleStatusChange = (status: any) => {
    updateTask(task.id, { status });
  };

  return <div>{task.title} - {task.status}</div>;
}
```

### 7. Constants and Colors

```typescript
// ✅ GOOD: Reusable, maintainable constants
const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
  high: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
};

const TASK_STATUSES = ['pending', 'active', 'completed'] as const;

export function TaskBadge({ priority }: { priority: keyof typeof PRIORITY_COLORS }) {
  return <span className={PRIORITY_COLORS[priority]}>{priority}</span>;
}

// ❌ BAD: Hardcoded values scattered throughout
export function TaskBadge({ priority }) {
  const color = priority === 'high' ? 'bg-red-100' : 'bg-gray-100';
  return <span className={color}>{priority}</span>;
}
```

## Common Mistakes to Avoid

### Mistake 1: Multiple Supabase Instances
```typescript
// ❌ DON'T: Create new instances everywhere
const supabase1 = createClient(...);
const supabase2 = createClient(...);

// ✅ DO: Use centralized client
import { supabaseClient } from '@/lib/supabase/client';
```

### Mistake 2: Unhandled Errors
```typescript
// ❌ DON'T: Ignore error responses
const { data } = await client.from('tasks').select('*');
setTasks(data);

// ✅ DO: Always handle errors
const { data, error } = await client.from('tasks').select('*');
if (error) {
  setError(error.message);
  return;
}
setTasks(data);
```

### Mistake 3: Using 'any' Type
```typescript
// ❌ DON'T: Use any type
interface Data {
  items: any[];
  metadata: any;
}

// ✅ DO: Define proper types
interface Item {
  id: string;
  title: string;
}

interface Data {
  items: Item[];
  metadata: { total: number };
}
```

### Mistake 4: Fetching Inside useEffect Without Dependencies
```typescript
// ❌ DON'T: Causes infinite loops or missing dependencies
useEffect(() => {
  fetch('/api/data').then(setData);
  // Warning: Missing dependency 'setData'
});

// ✅ DO: Proper dependency array
useEffect(() => {
  const fetchData = async () => {
    const res = await fetch('/api/data');
    setData(await res.json());
  };

  fetchData();
}, []); // Empty array = fetch once on mount
```

### Mistake 5: Mixing Concerns
```typescript
// ❌ DON'T: Business logic in component
export function Dashboard() {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    // Business logic here!
    const revenue = items.reduce((sum, item) => sum + item.amount, 0);
    setTotal(revenue);
  }, [items]);
}

// ✅ DO: Separate business logic
export async function Dashboard() {
  const total = await calculateTotalRevenue();
  return <DashboardContent total={total} />;
}
```

## Testing Guidelines

### Testing Metrics
```typescript
// lib/analytics/__tests__/metrics.test.ts
import { calculateCompletionRate } from '../metrics';

describe('calculateCompletionRate', () => {
  it('returns 0 when no tasks exist', async () => {
    const rate = await calculateCompletionRate();
    expect(rate).toBe(0);
  });

  it('returns percentage between 0-100', async () => {
    const rate = await calculateCompletionRate();
    expect(rate).toBeGreaterThanOrEqual(0);
    expect(rate).toBeLessThanOrEqual(100);
  });
});
```

### Testing Components
```typescript
// app/__tests__/page.test.tsx
import { render, screen } from '@testing-library/react';
import Dashboard from '../page';

describe('Dashboard', () => {
  it('renders KPI cards', async () => {
    // Dashboard is async Server Component
    const { container } = render(await Dashboard());
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });
});
```

## Performance Checklist

- [ ] Use `Promise.all()` for parallel queries
- [ ] Select specific columns, not `SELECT *`
- [ ] Add `.limit()` to prevent large datasets
- [ ] Use indexes on frequently queried columns
- [ ] Cache expensive calculations
- [ ] Lazy-load heavy components
- [ ] Minimize client-side JavaScript
- [ ] Use Server Components for data fetching
- [ ] Optimize images and assets
- [ ] Monitor query performance

## Naming Conventions

```typescript
// ✅ GOOD: Clear, intentional naming
const PRIORITY_COLORS = { /* ... */ };  // Constants: UPPER_SNAKE_CASE
const priorityColors = { /* ... */ };    // Variables: camelCase
function getPriorityColor() { /* ... */ } // Functions: camelCase, descriptive verb
class TaskManager { /* ... */ }          // Classes: PascalCase
type TaskData = { /* ... */ };           // Types: PascalCase
interface ITask { /* ... */ }            // Interfaces: PascalCase, optional I prefix

// ❌ AVOID
const x = { /* ... */ };                 // Unclear
const prColor = { /* ... */ };           // Abbreviated
function pc() { /* ... */ }              // Unclear verb
const _data = { /* ... */ };             // Underscore prefix
```

## Code Review Checklist

Before merging code, check:

- [ ] All TypeScript errors resolved
- [ ] No `any` types used
- [ ] Error handling in place
- [ ] No console.errors in production code
- [ ] Follows established patterns
- [ ] Tests added/updated
- [ ] Constants extracted
- [ ] No hardcoded values
- [ ] Comments explain 'why', not 'what'
- [ ] Performance considered
- [ ] Accessibility checked
- [ ] Mobile responsive

## Resources

- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase Client Library](https://supabase.com/docs/reference/javascript)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Testing Library](https://testing-library.com)
