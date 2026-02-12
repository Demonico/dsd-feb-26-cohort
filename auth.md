# Authentication

This README file outlines the authentication and authorization aspect of the project

## Method of authentication

- The team has chosen the preferred mode as Smart Links sent via SMS/Email
- Smart Links are a modern way to the "passwordless" aspect of authentication that saves time and also comes in handy if user has forgotten their password or the stored password is deleted

## Auth Providers and their comparision

|   Auth Provider    |                              Description                               |                                                                   Pros                                                                    |                                                                         Cons                                                                         |                                              Ease of integration with our application                                              |
| :----------------: | :--------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------: |
|       Auth0        |         The industry standard for "Identity" acquired by Okta          |          • Reliability: Enterprise-grade uptime and security • Feature Set: Supports every standard (SAML, OIDC) out of the box           |                                 • Price: Very expensive B2C pricing at scale • Complexity: Overkill for our project                                  |           MediumRequired creating a custom "Action" in Auth0 to sign the JWT with our application's Supabase secret key            |
|   Supabase Auth    |       Built-in identity providers for Supabase that wraps GoTrue       |     • Native Integration: Zero extra setup with your DB • Cost: Free for up to 50k MAUs. • RLS: Direct support for Row Level Security     |     • SMS Cost: Need to pay Twilio/MessageBird for the actual SMS sending • Vendor Lock-in: Harder to migrate away from Supabase ecosystem later     |               Native Zero code required for the handshake The JWT is automatically generated and accepted by the DB                |
|     FusionAuth     |             Developer-focused self-hostable auth platform              |                    • Free Plan: Unlimited users if we self-host • Flexibility: Highly customizable registration forms                     |             • UI/UX: Default login pages are ugly and need heavy styling • Resource Heavy: Requires significant server resources to run              |                        Low Similar to Auth0 but with less documentation for the specific Supabase handshake                        |
|    SuperTokens     |                 Open-source alternative to Auth0/Clerk                 |             • Self-Hosted: We can host it ourselves to keep data private • No Vendor Lock-in: We own the user data completely             |             • Maintenance: We are responsible for keeping the auth server running • Setup: More complex to configure than Supabase/Clerk             |  Medium Good documentation, but we will have to override their backend functions to inject the Supabase signing key into the JWT   |
|      Descope       |               Drag-and-drop authentication flow builder                |    • Visual Builder: Design complex auth flows (e.g., risk-based MFA) visually • B2B Focus: Great for enterprise customer requirements    |              • Newer Player: Smaller community and ecosystem than Auth0 • Overkill: Visual flows might be too complex for a simple MVP               |               Medium Good React SDK, but mapping the user roles to Supabase RLS policies required custom JWT mapping               |
|   Twilio Verify    |            API-only service for sending and validating OTPs            |         • Global Reach: Best-in-class SMS delivery rates worldwide • Control: We will build the exact UI/Logic we want in FastAPI         |                   • High Effort: We have to build the backend token logic • Price: We pay per successful verification (can add up)                   |         Low We would have to build the auth logic from scratch and mint the JWTs in FastAPI after Twilio verifies the code         |
| Magic (Magic Labs) |           Dedicated provider for "One-tap logic experiences            |        • Polish: The smoothest "click to log in" UI in the industry • Web3: Native support for crypto wallets (if we ever need it)        |       • Price: One of the most expensive options per user • Limited Scope: Really only does "Magic Links" well; lacks broader user management        |                      Low Requires a manual backend exchange to swap the Magic DID token for a Supabase token                       |
|       Stytch       | A "Passwordless-first" platforms designed specifically for magic links |  • Device Intelligence: Detects bots vs. real users to prevent fraud • UX: "Seamless" links that work across different browsers/devices   |               • Learning Curve: Uses a different paradigm (SDKs) than standard OAuth • Cost: Pay-per-active-user model can get pricey                | Medium Has a "Connected Apps" feature for Supabase, but we will have to manually handle the session exchange in our React frontend |
|       Clerk        |   Authentication built specifically for React/Next.js modern stacks    | • Dev Experience: Incredible drop-in React components (UserProfile, SignIn) • Multi-tenancy: Great for managing "Homeowner Organizations" |                    • Limit: Less control over the backend logic compared to Supabase • Cost: Gets expensive quickly as you scale                     |                      High Has a dedicated Supabase integration feature that mints a Supabase-compatible token                      |
| Postmark + FastAPI |              "DIY" Approach using transactional email API              |      • Cheapest: We will only pay for email sending (pennies) • Total Control: We will own the token generation and validation logic      | • Security Risk: We have to the implement secure token hashing/salting in-house • Maintenance: We have to build "Forgot Password" flows from scratch |               Hard We will be writing the encryption, token generation, and validation logic from scratch in Python                |

**Recommendation**

- **Supabase Auth (first-place):** It is the only one that works "out of the box" with Row Level Security policies (RLS policies). We would not have to write any "glue code" to make the DB secure.

- **Clerk (second-place):** If are willing to pay a bit more for a beautiful UI, Clerk's integration is nearly seamless. We just have to past our Supabase JWT secret into the Clerk dashboard, and it handles the rest.

## Authentication entry points based on user groups

**Authentication (Who I am)** and **Authorization (What I can see)**

### Distinct Entry Points

Even though we have a single React app, we should treat Drivers and Homeowners as entering through different "Doors"

| User Group | Entry Point                           | Primary Auth Method                                                                                     |
| ---------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Driver     | The "App" Login `/login/driver`       | **Phone OTP (SMS)** They open the app at the start of their shift. They rarely log out.                 |
| Homeowner  | The "Action" Link `/portal?token=xyz` | **Magic Link (Email/SMS)** They don't "browse" the app; they enter to do one specific thing (Skip/Pay). |

**Where is authentication required?**

We need adopt a "[Zero Trust](https://cloud.google.com/learn/what-is-zero-trust)" model. Every single page requires a valid session except the landing/login page.

- **Driver Routes (Protected)**
  - `/manifest` (The daily list for drivers) - **Requires:** `role='driver'`
  - `/task/{id}/complete` (The evidence upload) - **Requires:** `role='driver'` AND `driver_id == route_assignee`

- **Homeowner Routes (Protected)**
  - `/schedule` (Calendar view) - **Requires:** `role='homeowner'`

  - `/billing` (Invoices) - **Requires:** `role='homeowner'` AND `bill_owner == auth.uid()`

### The Smart Link Flow (How Auth Persists)

When a homeowner clicks a "[Magic Link](https://postmarkapp.com/blog/magic-links)" in their SMS or Email (`sampleapp.com/login?token=123..`), they aren't just visiting page; they are performing a _secure handshake._

**Step-by-step flow:**

- **The Click:** User clicks the link

- **The Intercept (React Router):** The React app loads. A specialized component (e.g., `<AuthCallback />`) detects the `#access_token=…` fragment in the URL
  - Take a call to hide the token in the URL

- **The Exchange (Supabase Client):**
  - The React Supabase Client takes the hash fragment and automatically calls `supabase.auth.getSession()`

  - It verifies the token with Supabase servers

  - It saves the Session (JWT) into the browser's `LocalStorage` (or Cookies)

- **The State Update (React Context):**
  - The `<AuthProvider >` component sees the new session

  - It updates the global state: `user = { id: '…', role: 'homeowner' }`

- **The Navigation:**
  - The user is effectively "Logged In"

  - React Router redirects them from /login to /dashboard

- **Persistence:** As they click different pages, the `Supabase Client` automatically attaches the JWT from LocalStorage to every request sent to the FastAPI backend.

### Ensuring User-Level Security (The 3 layers)

How will our application stop Homeowner A from changing the URL ID to see Homeowner B's trash schedule? The answer is [Defense in Depth](<https://en.wikipedia.org/wiki/Defense_in_depth_(computing)>).

#### Layer 1: Frontend guards (UX-based Security)

- **What it does:** Hides button/pages the user shouldn't see

- **Sample code:**

```JavaScript
// React Router Protection
<Route element={<RequireRole role="driver" />}>
<Route path="/manifest" element={<ManifestPage />} />
</Route>
```

- _Note:_ This is easily bypassed by a tech-savvy user using "Inspect Element". This method is for usability, not true security

#### Layer 2: FastAPI Middleware (API Security)

- **What it does:** Prevents unauthorized actions (e.g., "Skip Pickup")

- **Code:**

```python
# FastAPI Dependency

async def verify_ownership(task_id: int, user: User = Depends(get_current_user)):
    task = await db.get(Task, task_id)
    if task.owner_id != user.id:
        raise HTTPException(403, "You do not own this task.")
```

#### Layer 3: Supabase RLS (Data Security - The "Iron Dome")

- **What it does:** The database itself refuses to return rows that don't belong to the user. Even if the FastAPI code has a bug, the data is safe.

- **SQL Policy:**

```sql
-- Policy for Homeowners viewing Tasks
CREATE POLICY "Homeowners can only see their own tasks"
ON tasks
FOR SELECT
USING (
    exists (
        select 1 from locations
        where locations.id = tasks.location_id
        and locations.customer_id = auth.uid()
    )
);
```

### Implementation Checklist for MVP

- **Create the `<AuthCallback>` Route:** This is the invisible page that handles the Magic Link "handshake" before redirecting the user.

- **Set RLS Policies:** This should not wait for the end. Enable RLS on `tasks` and `locations` tables.

- **Test the "Leaky Data":** Create two test HOs. Log in as Homeowner A and try to manually fetch Homeowner B's data via the API (using Postman or curl). If it works, our security is flawed.

#### Summary

- **Identity:** Use Supabase Auth. Drivers $\rightarrow$ SMS. Homeowners $\rightarrow$ Email.
- **Data:** Create a profiles table to store the role.
- **Logic:** Use FastAPI Dependencies to block unauthorized actions.
- **Data Safety:** Use RLS Policies to block unauthorized reads.
