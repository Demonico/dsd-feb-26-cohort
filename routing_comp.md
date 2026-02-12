# Spike Summary: Role-Based Page Routing & Composition (MVP)

## Purpose of This Spike
The goal of this spike was to determine **how to handle role-based page routing and page composition** in a React application **without over-engineering the MVP**, while still allowing the system to scale.

---

## Problem Being Solved
- Restrict access to pages based on user role
- Render different UI experiences depending on role
- Support an MVP with minimal complexity
- Avoid architectural decisions that block future growth

---

## What Was Researched

### React Routing Libraries
- React Router
- TanStack Router
- File-based routing (framework-specific)

**Evaluation criteria:**
- Compatibility with Vite + React
- Industry adoption and familiarity
- Support for nested routes and layouts
- Ease of role-based routing
- MVP-level complexity

---

## Routing Library Options

### 1. React Router (Recommended)
**Status:** Industry standard  
**Pros:**
- Mature, stable, well-documented
- First-class support for nested routes
- Easy role-based route guards
- Large ecosystem and community support

**Cons:**
- Slight boilerplate compared to file-based routing

**Best for:** MVP → Production scaling

---

### 2. TanStack Router
**Pros:**
- Strong TypeScript support
- Built-in route validation
- Explicit and structured routing

**Cons:**
- Smaller community
- Higher learning curve
- Overkill for MVP

**Best for:** Large TypeScript-heavy apps

---

### 3. File-Based Routing (Framework-specific)
Examples: Next.js, Remix

**Pros:**
- Minimal configuration
- Fast prototyping

**Cons:**
- Requires framework migration
- Less explicit control for complex role logic

**Best for:** Framework-native projects

---

## Routing Decision

### ✅ React Router (Chosen)
**Why:**
- Industry standard and well-documented
- Familiar to most developers
- Supports nested routes and layouts
- Simple to implement role-based route guards
- Scales from MVP to production

**Conclusion:**  
React Router provides the lowest-risk, lowest-complexity solution for the MVP.

---

## Authentication & Role Source (Supabase)

**Supabase will be used for authentication**, including:
- User sign-up and login
- Session management
- Issuing JWT access tokens

**Role handling approach:**
- User authenticates via Supabase
- Supabase JWT is sent with frontend requests
- FastAPI validates the JWT
- User role is resolved server-side (e.g. from Supabase metadata or database)
- Role is returned to the frontend for routing and composition

> Supabase handles **identity**.  
> FastAPI remains the **source of truth for authorization**.

---

## Role-Based Page Routing

**What it means:**
- Controls *which routes* a user can access based on role

**How it works conceptually:**
- User authenticates via Supabase
- Role is resolved by backend
- Routes are protected on the frontend for UX
- Backend (FastAPI) enforces authorization as the source of truth

**Important:**  
Frontend routing improves UX but is **not a security boundary**.

---

## Role-Based Page Composition

**What it means:**
- Controls *what UI is rendered* inside a page based on role

This is separate from routing.

### Composition Patterns Identified

1. **Role-Specific Layouts**
- CustomerLayout
- DriverLayout

Each layout defines navigation, tools, and page structure.

2. **Conditional Components**
- Shared routes
- Components rendered based on role

Example:
- Customer sees pickup request form
- Driver sees route manifest

3. **Shared Pages, Different Content**
- Same route (e.g. `/dashboard`)
- Role determines which widgets appear

---

## Roles Evaluated: 2 vs 3

### Option A: 2 Roles (Customer + Driver)
Driver acts as Admin for MVP.

**Pros:**
- Fastest to build
- Minimal routing and UI complexity
- Fewer permissions to manage

**Cons:**
- Driver UI may grow cluttered

**Best for:** MVP / pilot phase

---

### Option B: 3 Roles (Customer + Driver + Admin)

**Pros:**
- Clear separation of concerns
- Cleaner UIs per role
- Easier long-term scaling

**Cons:**
- More routes, layouts, and logic
- Higher upfront complexity

**Best for:** Growth phase

---

## Recommendation

For the MVP:
- ✅ Use **React Router**
- ✅ Use **Supabase for authentication**
- ✅ Start with **2 roles** (Customer + Driver)
- ✅ Use **role-based route guards**
- ✅ Use **layout-based and component-based composition**
- ✅ Enforce authorization in **FastAPI**

---

## What Was Discovered During This Spike

- Role-based routing and role-based page composition are related but **distinct problems**
- Routing controls **access**
- Composition controls **UI structure**
- Authentication (Supabase) and authorization (FastAPI) must be separated
- MVP complexity increases significantly when adding roles early
- A layout-based approach solves both problems cleanly

---

## Outcome
This spike provides:
- A clear routing strategy
- A clear UI composition strategy
- A justified MVP role model
- A scalable path forward without over-engineering
