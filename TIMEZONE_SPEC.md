# Timezone Handling Specification

## Problem

Times were inconsistent across the system because timezone offsets were
stripped when converting FullCalendar dates to `datetime-local` input values.
The bare string `"2026-04-10T09:00"` means 9:00 AM UTC on the server (Vercel)
but 9:00 AM Pacific in the browser — a 7-hour discrepancy.

## Architecture

### 1. Storage — UTC in Firestore

All `startDatetime` and `endDatetime` values are stored as Firestore Timestamps
in UTC. This is the single source of truth.

### 2. Client → Server — ISO strings with offset

The browser MUST send dates as ISO strings that include timezone info, either:
- Full offset: `"2026-04-10T09:00:00-07:00"` (preferred)
- UTC: `"2026-04-10T16:00:00.000Z"`

The `datetime-local` HTML input gives bare strings like `"2026-04-10T09:00"`.
These MUST be converted to offset-aware ISO strings before being stored in
React state or sent to the API:

```typescript
// Convert datetime-local value to ISO with the browser's timezone offset
function localInputToISO(localStr: string): string {
  return new Date(localStr).toISOString()
}
```

### 3. Server Processing

`new Date("2026-04-10T16:00:00.000Z")` always produces the correct UTC Date
regardless of the server's timezone. Firestore's `Timestamp.fromDate()` stores it
as UTC.

### 4. Display — Community Timezone

Each community has a `timezone` field (IANA string, e.g. `"America/Chicago"`).

- **Emails**: `formatDateRange(date, date, community.timezone)` — runs on server
- **Calendar popups/cards**: `formatDateRange(date, date)` — runs in browser.
  Default to `"America/Chicago"` for now; should use community timezone when
  threaded through.
- **FullCalendar grid**: Automatically uses `timeZone` prop. Should be set to
  the community timezone so all users see the same local times regardless of
  their browser timezone.

### 5. FullCalendar Configuration

Set `timeZone={communityTimezone}` on all FullCalendar instances so the grid
displays times in the community's timezone, not the viewer's browser timezone.
This ensures a Pacific user booking a Central-time amenity sees Central times.

### 6. Where Conversions Happen

| Location | Format | Notes |
|----------|--------|-------|
| FullCalendar `select` callback | ISO with offset | Already correct |
| FullCalendar `dateClick` callback | ISO date string | Needs time component added |
| `datetime-local` input → state | Bare local string | **Must convert to ISO with offset** |
| API request body | ISO string | Server does `new Date(str)` |
| Firestore storage | Timestamp (UTC) | Via `Timestamp.fromDate(new Date(str))` |
| Calendar events API response | ISO string (UTC) | From `date.toISOString()` |
| FullCalendar rendering | Uses `timeZone` prop | Set to community timezone |
| Email formatting | `formatDateRange(date, tz)` | Uses community timezone |
| Popup/card formatting | `formatDateRange(date, tz)` | Uses community timezone |
