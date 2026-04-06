# Multi-Community Architecture Plan

**Version:** 1.0
**Date:** April 2026
**Status:** Planning

---

## 1. Overview

Transform Neighbri from a single-community amenity booking system into a multi-tenant platform where multiple HOA communities share the same infrastructure. Each community has its own amenities, bookings, staff, and settings. Users can belong to multiple communities with different roles in each.

---

## 2. Goals

- Allow multiple HOA communities to use the same Neighbri instance
- Users can belong to multiple communities and switch between them
- Each community's data is fully isolated (no cross-contamination)
- Internal admin tool for Neighbri staff to manage onboarded communities
- Minimal disruption to the existing UX — same booking flow, same admin tools
- Migrate all existing data to a default community seamlessly

---

## 3. Data Model Changes

### 3.1 New Collection: `/communities/{id}`

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Display name (e.g., "Sanctuary HOA") |
| `slug` | string | URL-safe identifier (e.g., "sanctuary"), unique |
| `address` | string \| null | Physical address |
| `city` | string \| null | City |
| `state` | string \| null | State |
| `zip` | string \| null | ZIP code |
| `logoUrl` | string \| null | Community logo (for branding) |
| `contactEmail` | string \| null | Primary contact email |
| `contactPhone` | string \| null | Primary contact phone |
| `plan` | string | 'free' \| 'standard' \| 'premium' |
| `isActive` | boolean | Whether the community is active |
| `maxAmenities` | number | Plan limit on amenities |
| `maxMembers` | number | Plan limit on members |
| `createdAt` | Timestamp | When the community was onboarded |
| `createdBy` | string | Firebase UID of the super-admin who created it |

### 3.2 New Collection: `/communityMembers/{id}`

Replaces the current role/status on the Resident record. A user can have multiple memberships.

| Field | Type | Description |
|-------|------|-------------|
| `communityId` | string | Reference to `/communities/{id}` |
| `userId` | string | Firebase UID |
| `residentId` | string | Reference to `/residents/{id}` for this user |
| `role` | string | 'resident' \| 'property_manager' \| 'janitorial' \| 'board' |
| `status` | string | 'pending' \| 'approved' \| 'denied' |
| `joinedAt` | Timestamp | When they joined/requested |
| `approvedBy` | string \| null | Firebase UID of PM who approved |
| `approvedAt` | Timestamp \| null | When they were approved |

### 3.3 New Collection: `/communityInvites/{id}`

For invite links and community codes.

| Field | Type | Description |
|-------|------|-------------|
| `communityId` | string | Which community |
| `code` | string | Invite code (e.g., "SANCTUARY2026") |
| `createdBy` | string | Firebase UID |
| `createdAt` | Timestamp | |
| `expiresAt` | Timestamp \| null | Optional expiration |
| `maxUses` | number \| null | Optional max redemptions |
| `useCount` | number | How many times redeemed |
| `isActive` | boolean | Can be deactivated |

### 3.4 Modified Existing Collections

Every existing collection gets a `communityId: string` field:

| Collection | New field | Notes |
|------------|-----------|-------|
| `/amenities/{id}` | `communityId` | Required |
| `/areas/{id}` | `communityId` | Required |
| `/bookings/{id}` | `communityId` | Required |
| `/turnWindows/{id}` | `communityId` | Required |
| `/inspectionReports/{id}` | `communityId` | Required |
| `/auditLogs/{id}` | `communityId` | Required |

### 3.5 Modified: `/residents/{id}`

The Resident record becomes a **user profile** — shared across all communities. Community-specific fields (role, status) move to `communityMembers`.

**Remove from Resident:**
- `status` (moves to communityMember)

**Keep on Resident:**
- `firebaseUid`, `name`, `email`, `phone`, `unitNumber`, `stripeCustomerId`, `createdAt`

The `unitNumber` may need to become per-community (different units in different communities). Options:
- Keep on Resident for the primary community
- Move to `communityMembers.unitNumber`
- **Recommended:** Move to `communityMembers` since a user may have different units in different communities

### 3.6 Modified: Settings

Currently: `/settings/global` (singleton document)

**After:** `/communities/{id}/settings` (subcollection, one per community)

| Field | Type | Description |
|-------|------|-------------|
| `pmEmail` | string | PM notification email for this community |
| `orgName` | string | Organization name |
| `approvalJwtSecret` | string | Auto-generated per community |
| `defaultAmenityId` | string \| null | Default amenity for this community |

### 3.7 New: Super-Admin Flag

Firebase Auth custom claims get a new field:

```typescript
{
  role: 'resident',           // per-community role (set when switching)
  superAdmin: true,           // global flag for internal admin access
  activeCommunityId: 'abc123' // currently active community
}
```

---

## 4. User Experience

### 4.1 Sign-Up Flow (Changed)

**Current:**
1. User signs up → creates account + resident record with status: pending
2. PM approves → user can book

**After:**
1. User signs up → creates account + resident record (no community yet)
2. User is prompted to **join a community** via invite code or link
3. Creates a `communityMember` with status: pending
4. Community PM approves → user can book in that community
5. User can join additional communities later

### 4.2 Community Switcher

A dropdown in the nav bar showing all communities the user belongs to:

```
[Sanctuary HOA ▾]
  ✓ Sanctuary HOA (Property Manager)
    Lakewood Estates (Resident)
    + Join another community
```

Switching updates a session cookie (`__activeCommunity`) and reloads the page. All data queries use this active community ID.

### 4.3 Join Community Flow

**Option A: Invite Code**
- PM creates an invite code in admin settings (e.g., "SANCTUARY2026")
- Resident enters the code on a "Join Community" page
- Creates a pending communityMember

**Option B: Invite Link**
- PM generates a link: `neighbri.com/join/SANCTUARY2026`
- Resident clicks the link → auto-fills the code → join flow

**Option C: PM Invites Directly**
- PM enters the resident's email in the People page
- System sends an invite email with a link
- Resident clicks link → creates account if needed → joins community

**Recommended:** Support all three. Start with Option A (simplest).

### 4.4 Per-Community Role Assignment

A user can be a PM in one community and a resident in another:

| Community | Role |
|-----------|------|
| Sanctuary HOA | property_manager |
| Lakewood Estates | resident |
| Riverside Condos | janitorial |

When the user switches communities, the nav bar and permissions update to match their role in that community.

### 4.5 Booking Flow (Minimal Changes)

The booking flow stays the same — the only change is that all data is filtered by `activeCommunityId`. The resident only sees amenities, bookings, and calendar events for their active community.

---

## 5. API Changes

### 5.1 Community Context

Every API route that accesses community-scoped data needs to know the active community. Two approaches:

**Option A: Read from session cookie**
```typescript
function getActiveCommunityId(): string | null {
  const cookieStore = cookies()
  return cookieStore.get('__activeCommunity')?.value ?? null
}
```

**Option B: Read from request header**
```typescript
const communityId = req.headers.get('x-community-id')
```

**Recommended:** Cookie (Option A) — automatically sent with every request, works with SSR.

### 5.2 Query Scoping

Every Firestore query that currently does:
```typescript
adminDb.collection('amenities').get()
```

Becomes:
```typescript
adminDb.collection('amenities').where('communityId', '==', activeCommunityId).get()
```

### 5.3 New API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/communities` | GET | List communities the user belongs to |
| `/api/communities/switch` | POST | Set active community (cookie) |
| `/api/communities/join` | POST | Join a community via invite code |
| `/api/admin/community` | GET | Get active community details |
| `/api/admin/community` | PUT | Update community settings |
| `/api/admin/community/invites` | GET/POST | Manage invite codes |
| `/api/internal/communities` | GET | List all communities (super-admin) |
| `/api/internal/communities` | POST | Create community (super-admin) |
| `/api/internal/communities/{id}` | GET/PUT/DELETE | Manage community (super-admin) |
| `/api/internal/users` | GET | List all users (super-admin) |
| `/api/internal/metrics` | GET | Platform metrics (super-admin) |

### 5.4 Modified API Routes

Every existing API route needs the community filter. Key files:

| Route | Change |
|-------|--------|
| `GET /api/amenities` | Add `.where('communityId', '==', activeId)` |
| `POST /api/bookings` | Set `communityId` on new booking |
| `GET /api/calendar/events` | Filter by communityId |
| `GET /api/admin/residents` | Query communityMembers instead |
| `PUT /api/admin/residents/{id}` | Update communityMember, not resident |
| `GET /api/admin/amenities` | Filter by communityId |
| `GET /api/admin/areas` | Filter by communityId |
| `GET /api/admin/settings` | Read from community subcollection |
| `PUT /api/admin/settings` | Write to community subcollection |
| `GET /api/turn-windows` | Filter by communityId |
| `POST /api/admin/turn-windows` | Set communityId |
| `GET /api/cron` | Process all communities |

---

## 6. Frontend Changes

### 6.1 Community Context Provider

New React context that provides the active community to all components:

```typescript
interface CommunityContextType {
  activeCommunity: Community | null
  memberships: CommunityMember[]
  switchCommunity: (communityId: string) => Promise<void>
  loading: boolean
}
```

Wraps the app layout. Fetches user's community memberships on mount.

### 6.2 Community Switcher Component

Dropdown in the NavBar:
- Shows all communities the user belongs to
- Displays role badge for each
- "Join another community" link at the bottom
- Active community has a checkmark

### 6.3 Join Community Page

New page at `/join` (or `/join/{code}`):
- Enter invite code
- Shows community name + description
- "Request to join" button
- Creates pending communityMember
- Redirects to community's booking page after joining

### 6.4 Pages That Need Community Scoping

| Page | What changes |
|------|-------------|
| `/resident` (booking) | Amenities filtered by community |
| `/resident/bookings` | Bookings filtered by community |
| `/admin/dashboard` | Calendar events filtered by community |
| `/admin/amenities` | Amenities for this community only |
| `/admin/people` | CommunityMembers for this community |
| `/account` | Show community memberships list |

### 6.5 Internal Admin Pages

New route group: `/internal/*` (super-admin only)

| Page | Description |
|------|-------------|
| `/internal` | Dashboard with metrics |
| `/internal/communities` | List all communities with status, plan, member count |
| `/internal/communities/new` | Create new community form |
| `/internal/communities/{id}` | Community detail — edit, members, bookings, activate/deactivate |
| `/internal/users` | All users across all communities |

---

## 7. Authentication & Authorization Changes

### 7.1 Custom Claims

Currently: `{ role: 'property_manager' }`

After: `{ superAdmin?: boolean }`

The per-community role is no longer stored in custom claims (it varies by community). Instead:
- Read role from `communityMembers` collection for the active community
- Cache in the session or community context
- `superAdmin` stays in custom claims (global flag)

### 7.2 Middleware Changes

The proxy middleware needs to:
1. Check session cookie (existing)
2. Check for active community cookie
3. For `/internal/*` routes, verify `superAdmin` custom claim
4. For `/admin/*` routes, verify PM role in the active community

### 7.3 Role Resolution

When a user switches communities, their effective role changes:
```typescript
async function getActiveRole(userId: string, communityId: string): Promise<string> {
  const member = await getCommunityMember(userId, communityId)
  return member?.role ?? 'resident'
}
```

This replaces reading role from Firebase custom claims for per-community permissions.

---

## 8. Data Migration

### 8.1 Create Default Community

```typescript
const defaultCommunity = await createCommunity({
  name: 'Sanctuary HOA',
  slug: 'sanctuary',
  isActive: true,
  plan: 'standard',
})
```

### 8.2 Add communityId to All Existing Records

```typescript
// For each collection: amenities, areas, bookings, turnWindows, etc.
const snap = await adminDb.collection('amenities').get()
for (const doc of snap.docs) {
  await doc.ref.update({ communityId: defaultCommunity.id })
}
```

### 8.3 Migrate Residents to CommunityMembers

```typescript
const residents = await adminDb.collection('residents').get()
for (const doc of residents.docs) {
  const r = doc.data()
  await adminDb.collection('communityMembers').add({
    communityId: defaultCommunity.id,
    userId: r.firebaseUid,
    residentId: doc.id,
    role: /* read from Firebase Auth custom claims */,
    status: r.status ?? 'approved',
    joinedAt: r.createdAt,
    unitNumber: r.unitNumber,
  })
}
```

### 8.4 Migrate Settings

```typescript
const settings = await adminDb.collection('settings').doc('global').get()
await adminDb.collection('communities').doc(defaultCommunity.id)
  .collection('settings').doc('config').set(settings.data())
```

---

## 9. Implementation Phases

### Phase 1: Foundation (Data Model + Internal Admin)

**Goal:** Community and CommunityMember data model, internal admin tool, migration script.

| Task | Files | Estimate |
|------|-------|----------|
| Add Community and CommunityMember types to db.ts | 1 file | 30 min |
| Community CRUD helpers (create, get, update, list) | 1 file | 30 min |
| CommunityMember CRUD helpers | 1 file | 30 min |
| Internal admin API routes | 5-6 files | 1 hr |
| Internal admin pages (communities list, detail, create) | 3-4 files | 2 hrs |
| Super-admin auth check | 2 files | 30 min |
| Migration script | 1 file | 1 hr |
| **Total** | **~15 files** | **~6 hrs** |

### Phase 2: Community Scoping (The Big Refactor)

**Goal:** Every query filters by communityId. Community context in React.

| Task | Files | Estimate |
|------|-------|----------|
| Community context provider | 1 file | 1 hr |
| Community switcher component | 1 file | 1 hr |
| Active community cookie management | 2 files | 30 min |
| Add communityId to all Firestore helpers | 1 file (db.ts) | 2 hrs |
| Update all API routes to pass communityId | 20+ files | 3 hrs |
| Update proxy middleware for community | 1 file | 30 min |
| **Total** | **~25 files** | **~8 hrs** |

### Phase 3: User Flow Changes

**Goal:** New sign-up flow, join community, per-community roles.

| Task | Files | Estimate |
|------|-------|----------|
| Update sign-up to not require community | 2 files | 30 min |
| Join community page | 2 files | 1 hr |
| Invite code management (admin) | 3 files | 1 hr |
| Per-community role resolution (replace custom claims) | 3 files | 1 hr |
| Update People page for communityMembers | 2 files | 1 hr |
| Update NavBar for community switcher | 1 file | 30 min |
| Account page shows community memberships | 1 file | 30 min |
| **Total** | **~15 files** | **~6 hrs** |

### Phase 4: Internal Admin Tool Polish

**Goal:** Metrics, user lookup, community management dashboard.

| Task | Files | Estimate |
|------|-------|----------|
| Metrics API (counts across communities) | 1 file | 30 min |
| Internal dashboard page | 1 file | 1 hr |
| User lookup page | 2 files | 1 hr |
| Community detail page (members, bookings) | 2 files | 1 hr |
| **Total** | **~6 files** | **~4 hrs** |

### Total Estimated Effort

| Phase | Estimate |
|-------|----------|
| Phase 1: Foundation | ~6 hrs |
| Phase 2: Scoping | ~8 hrs |
| Phase 3: User Flows | ~6 hrs |
| Phase 4: Internal Admin | ~4 hrs |
| **Total** | **~24 hrs** |

---

## 10. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Missing a communityId filter on a query | Data leak between communities | Automated test that verifies every Firestore query includes communityId |
| Existing users lose access during migration | User disruption | Migration script creates communityMembers for all existing users automatically |
| Performance with many communities | Slow queries | Firestore indexes on communityId + status, communityId + amenityId, etc. |
| Session cookie conflicts | Wrong community data shown | Clear __activeCommunity cookie on sign-out; validate community membership on every request |
| Cron job needs to process all communities | Slower cron | Iterate communities and process each; parallelize if needed |

---

## 11. Firestore Indexes Needed

| Collection | Fields | Purpose |
|------------|--------|---------|
| `communityMembers` | `userId`, `status` | Find user's communities |
| `communityMembers` | `communityId`, `status` | List community members |
| `communityInvites` | `code` | Lookup invite by code |
| `amenities` | `communityId`, `sortOrder` | List amenities for community |
| `bookings` | `communityId`, `status` | Calendar events query |
| `bookings` | `communityId`, `residentId` | My bookings query |
| `areas` | `communityId`, `sortOrder` | List areas for community |
| `turnWindows` | `communityId`, `amenityId` | Turn windows for community |

---

## 12. Future Considerations

- **Custom domains per community** (e.g., booking.sanctuaryhoa.org) — Vercel supports this
- **Community branding** (logo, colors) — stored in community settings, applied via CSS variables
- **Billing per community** — Stripe subscriptions per community for the SaaS model
- **Cross-community analytics** — super-admin dashboard showing platform-wide metrics
- **Community templates** — pre-configured amenity sets for common community types
- **API access for communities** — allow communities to build integrations
