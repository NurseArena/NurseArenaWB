# BUG_PREVENTION.md

## ROLE

You are a senior production engineer reviewing and generating code for a large-scale production app built with:

- Next.js App Router
- React
- TypeScript
- Vercel
- Supabase
- Tailwind
- Edge/serverless functions

Your primary goal is:

- Prevent bugs
- Prevent security vulnerabilities
- Prevent deployment/runtime failures
- Prevent hydration issues
- Prevent data leaks
- Prevent performance regressions
- Maintain type safety
- Ensure production reliability

**NEVER optimize for speed of coding over correctness.**

---

## CODE REVIEW CHECKLIST

Run this before generating or approving any code.

### SECURITY
- [ ] RLS enabled
- [ ] Auth validated
- [ ] Permissions validated
- [ ] No secret exposure
- [ ] Input validated with Zod
- [ ] Output sanitized

### REACT
- [ ] No hydration risk
- [ ] Effects cleaned up
- [ ] Stable list keys
- [ ] No unnecessary rerenders

### NEXT.JS
- [ ] Correct server/client split
- [ ] No server imports in client code
- [ ] Edge-safe if applicable

### TYPESCRIPT
- [ ] No `any` types
- [ ] Null-safe access
- [ ] Typed responses

### DATABASE
- [ ] Indexed queries
- [ ] No N+1 queries
- [ ] Transactions where needed

### PERFORMANCE
- [ ] Bundle size reasonable
- [ ] Lazy loading used
- [ ] Pagination used

### DEPLOYMENT
- [ ] Env vars verified
- [ ] Build passes
- [ ] Lint passes
- [ ] Typecheck passes

---

## GLOBAL ENGINEERING RULES

### ALWAYS
- Use strict TypeScript
- Prefer server components unless interactivity is needed
- Use async/await consistently
- Validate all external input
- Handle loading, error, and empty states
- Handle null and undefined safely
- Add defensive checks
- Write production-safe code only
- Ensure accessibility
- Ensure mobile responsiveness
- Ensure SSR compatibility
- Ensure Edge runtime compatibility if applicable

### NEVER
- Hidden state mutations
- Race conditions
- Memory leaks
- Infinite renders
- Hydration mismatch
- Unhandled promise rejections

---

## NEXT.JS RULES

### APP ROUTER RULES
- Default to Server Components
- Only use `"use client"` when absolutely necessary
- Never put secrets in client components
- Never access `process.env` in client code unless prefixed with `NEXT_PUBLIC_`
- Never fetch sensitive data in client components
- Prefer server actions for mutations
- Use route handlers for protected APIs
- Use streaming/Suspense safely
- Use dynamic imports for heavy client libraries

### HYDRATION SAFETY

Never use the following during render:

```ts
Date.now()
Math.random()
new Date()
window // browser checks
```

Move browser-only logic to `useEffect`. Avoid locale-dependent rendering on the server. Avoid unstable IDs.

**BAD:**

```tsx
<div>{Date.now()}</div>
```

**GOOD:**

```tsx
const [time, setTime] = useState<number | null>(null)

useEffect(() => {
  setTime(Date.now())
}, [])
```

### SERVER VS CLIENT

Before writing any component, ask:

- Does this need interactivity?
- Does this need browser APIs?
- Does this need state?
- Does this need effects?

If **NO** to all: use a **Server Component**
If **YES** to any: use a **Client Component**

---

## REACT RULES

### STATE MANAGEMENT
- Keep state minimal
- Avoid duplicated state
- Avoid derived state when computable
- Use memoization only when necessary
- Prevent stale closures
- Prevent unnecessary rerenders

### EFFECT RULES

Every `useEffect` must have correct dependencies, clean up subscriptions/timers/listeners, and prevent race conditions.

**BAD:**

```ts
useEffect(() => {
  fetchData()
}, [])
```

**GOOD — mounted flag pattern:**

```ts
useEffect(() => {
  let mounted = true

  async function load() {
    const data = await fetchData()

    if (mounted) {
      setData(data)
    }
  }

  load()

  return () => {
    mounted = false
  }
}, [])
```

**PREFERRED — AbortController pattern for fetch:**

```ts
useEffect(() => {
  const controller = new AbortController()

  async function load() {
    try {
      const data = await fetchData({ signal: controller.signal })
      setData(data)
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setError(error)
      }
    }
  }

  load()

  return () => controller.abort()
}, [])
```

Use `AbortController` when fetching inside effects. It cancels in-flight requests on unmount and prevents setting state on unmounted components.

### LIST RENDERING

Never use array index as a key if the list can change.

**BAD:**

```tsx
items.map((item, i) => <Card key={i} />)
```

**GOOD:**

```tsx
items.map((item) => <Card key={item.id} />)
```

---

## TYPESCRIPT RULES

### TYPE SAFETY
- NEVER use `any`
- Prefer `unknown` over `any`
- Use Zod validation for external data
- Use discriminated unions
- Exhaustively check switch statements
- Infer types where possible
- Export shared types centrally

**BAD:**

```ts
const data: any = response
```

**GOOD:**

```ts
const data: UserResponse = response
```

### NULL SAFETY

Never assume data exists.

**BAD:**

```ts
user.name.toUpperCase()
```

**GOOD:**

```ts
user?.name?.toUpperCase() ?? ""
```

---

## SUPABASE SECURITY RULES

### CRITICAL SECURITY RULES

**NEVER:**
- Expose `service_role` key to client
- Disable RLS
- Trust client-side auth
- Trust client-side role checks
- Use anon key for privileged operations
- Return sensitive columns unnecessarily

**ALWAYS:**
- Enable RLS on every table
- Write explicit policies
- Validate ownership in SQL policies
- Use server-side auth validation
- Sanitize uploaded file paths
- Restrict bucket permissions
- Use signed URLs when needed

### RLS POLICY TEMPLATE

```sql
create policy "Users can view own data"
on profiles
for select
using (auth.uid() = user_id);
```

### SUPABASE CLIENTS

| Client | Where to use |
|--------|-------------|
| Browser client | Frontend components |
| Server client | Server components |
| Admin client | Server only, never client |

Never import the admin client into client components.

### AUTH: USE `getUser()` NOT `getSession()` ON THE SERVER

`getSession()` trusts the local token without re-validating with Supabase's server. On the server, always use:

```ts
const { data: { user }, error } = await supabase.auth.getUser()

if (!user || error) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

This re-validates the JWT with Supabase on every server request, preventing token spoofing.

### FILE STORAGE SAFETY
- Validate MIME types
- Validate file size
- Generate unique filenames
- Prevent path traversal
- Restrict public buckets
- Scan uploads if possible

---

## AUTHENTICATION RULES

### AUTH SAFETY

Always verify:
- Session exists
- User exists
- Token validity
- Permissions
- Ownership

Never trust:
- Frontend role
- Hidden UI
- Client route protection alone

### ROUTE PROTECTION

Protect all of these explicitly:
- API routes
- Server actions
- Route handlers
- Admin pages
- Uploads
- Mutations

**Middleware alone is NOT enough.**

---

## SERVER ACTION RULES

Every server action must validate auth before doing anything else. Agents will skip this if you do not require it explicitly.

```ts
'use server'

export async function updateProfile(formData: FormData) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const parsed = schema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    throw new Error('Invalid input')
  }

  // proceed with validated data
}
```

Rules for every server action:
- Call `getUser()` before any logic
- Validate input with Zod
- Never trust `formData` values directly
- Never expose internal errors to the client

---

## API RULES

### API VALIDATION

Every API endpoint must:
- Validate input
- Validate auth
- Validate permissions
- Handle errors
- Return typed responses
- Rate limit sensitive routes
- Avoid leaking internals

**Full Zod validation flow:**

```ts
const schema = z.object({
  email: z.string().email(),
})

const result = schema.safeParse(await request.json())

if (!result.success) {
  return NextResponse.json(
    { error: 'Invalid input' },
    { status: 400 }
  )
}

const { email } = result.data
```

Always use `safeParse`, not `parse`. It returns a result object instead of throwing, which you can handle cleanly.

### ERROR HANDLING

Never expose SQL errors, stack traces, internal tokens, or infrastructure info.

**BAD:**

```ts
return NextResponse.json(error)
```

**GOOD:**

```ts
return NextResponse.json(
  { error: 'Internal server error' },
  { status: 500 }
)
```

---

## DATABASE RULES

### DATABASE SAFETY
- Use transactions where needed
- Prevent race conditions
- Add indexes
- Avoid N+1 queries
- Paginate large queries
- Use constraints
- Use foreign keys
- Use cascading intentionally

### MIGRATION RULES

Before any migration:
- Verify rollback path
- Verify nullable constraints
- Verify production compatibility
- Avoid destructive migrations

Never drop columns without a migration plan.

---

## PERFORMANCE RULES

### AVOID
- Unnecessary client components
- Huge bundles
- Large dependencies
- Excessive rerenders
- Blocking requests
- Waterfall fetching

### PREFER
- Server rendering
- Caching
- Pagination
- Streaming
- Lazy loading
- Image optimization

### NEXT IMAGE

Always use `next/image`. Always specify `sizes`. Always configure remote patterns.

---

## VERCEL DEPLOYMENT RULES

Before every deployment, verify:
- All env vars exist in the Vercel dashboard
- No secrets leaked into client bundles
- Build succeeds locally
- Lint passes
- Typecheck passes
- Edge compatibility verified
- No Node-only APIs used in Edge functions
- No server imports in client code

### ENVIRONMENT VARIABLES

```ts
// validate at startup, not at runtime
if (!process.env.SUPABASE_URL) {
  throw new Error('Missing SUPABASE_URL')
}
```

Rules:
- Server secrets never exposed
- `NEXT_PUBLIC_` prefix only for genuinely public data
- Validate all required env vars at startup

---

## SECURITY RULES

### NEVER DO THESE
- Use `eval`
- Use `dangerouslySetInnerHTML` without sanitization
- Trust user-submitted HTML
- Trust uploaded files without validation
- Trust client-side permission checks
- Expose secrets in any form
- Log sensitive tokens
- Store plaintext passwords
- Disable CSRF protections
- Skip authorization checks

### XSS PREVENTION

Sanitize all user-generated content before rendering:
- Markdown output
- HTML content
- Rich text fields
- User bios
- Comments

### SQL SAFETY

Use parameterized queries only. Never concatenate SQL strings.

---

## ERROR HANDLING RULES

Every async operation must use try/catch, return a fallback UI, log safely, and fail gracefully.

```ts
try {
  const data = await getData()
  return data
} catch (error) {
  console.error(error)
  return null
}
```

---

## LOGGING RULES

Never log:
- Passwords
- JWTs
- Tokens
- Cookies
- API keys
- Personal data

Use structured logs with severity levels.

---

## TESTING RULES

Before finalizing any feature, verify coverage across:

### UNIT TESTS
- Utilities
- Hooks
- Validation
- Reducers

### INTEGRATION TESTS
- Auth flows
- API routes
- Database flows
- Uploads
- Permissions

### E2E TESTS
- Login and signup
- Checkout
- Dashboards
- Forms
- Protected routes

---

## FINAL RULE

When uncertain:

- Choose security over convenience
- Choose correctness over brevity
- Choose explicitness over magic
- Choose maintainability over cleverness

Assume all generated code will run in production with real users and attackers.
