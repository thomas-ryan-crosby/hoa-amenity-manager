import { google, calendar_v3 } from 'googleapis'
import { JWT } from 'google-auth-library'

function getCalendarClient(): calendar_v3.Calendar {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY

  if (!email) {
    throw new Error(
      'Missing GOOGLE_SERVICE_ACCOUNT_EMAIL environment variable. ' +
      'Set it to the service account email from your Google Cloud project.'
    )
  }

  if (!privateKey) {
    throw new Error(
      'Missing GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY environment variable. ' +
      'Set it to the PEM private key from your service account JSON key file.'
    )
  }

  // The private key may arrive with escaped newlines from env; normalise them.
  const formattedKey = privateKey.replace(/\\n/g, '\n')

  const auth = new JWT({
    email,
    key: formattedKey,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  })

  return google.calendar({ version: 'v3', auth })
}

/**
 * Check whether a calendar has any events overlapping the given time window.
 * Returns `true` when the slot is free (no conflicts).
 */
export async function checkAvailability(
  calendarId: string,
  start: Date,
  end: Date,
): Promise<boolean> {
  const calendar = getCalendarClient()

  try {
    const response = await calendar.events.list({
      calendarId,
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      // We only need to know if at least one event exists; limit to 1 result.
      maxResults: 1,
    })

    const events = response.data.items ?? []
    return events.length === 0
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Failed to check availability for calendar "${calendarId}" ` +
      `(${start.toISOString()} – ${end.toISOString()}): ${message}`
    )
  }
}

/**
 * Create a tentative (hold) event on the calendar and return its Google event ID.
 */
export async function createHold(
  calendarId: string,
  bookingId: string,
  start: Date,
  end: Date,
): Promise<string> {
  const calendar = getCalendarClient()

  try {
    const response = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: `[HOLD] Booking ${bookingId}`,
        description: `Tentative hold for booking ${bookingId}. Awaiting confirmation.`,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
        status: 'tentative',
        transparency: 'opaque',
      },
    })

    const eventId = response.data.id
    if (!eventId) {
      throw new Error('Google Calendar API returned an event without an ID.')
    }

    return eventId
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Failed to create hold for booking "${bookingId}" on calendar "${calendarId}": ${message}`
    )
  }
}

/**
 * Confirm an existing tentative event by changing its status to "confirmed"
 * and adding the provided attendees.
 */
export async function confirmEvent(
  calendarId: string,
  eventId: string,
  attendeeEmails: string[],
): Promise<void> {
  const calendar = getCalendarClient()

  try {
    await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: {
        summary: undefined, // keep existing summary; remove the [HOLD] prefix below
        status: 'confirmed',
        attendees: attendeeEmails.map((email) => ({ email })),
      },
    })

    // Fetch the event so we can strip the [HOLD] prefix from the summary.
    const existing = await calendar.events.get({ calendarId, eventId })
    const currentSummary = existing.data.summary ?? ''
    const cleanedSummary = currentSummary.replace(/^\[HOLD]\s*/, '')

    if (cleanedSummary !== currentSummary) {
      await calendar.events.patch({
        calendarId,
        eventId,
        requestBody: { summary: cleanedSummary },
      })
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Failed to confirm event "${eventId}" on calendar "${calendarId}": ${message}`
    )
  }
}

/**
 * Delete an event from the calendar.
 */
export async function deleteEvent(
  calendarId: string,
  eventId: string,
): Promise<void> {
  const calendar = getCalendarClient()

  try {
    await calendar.events.delete({ calendarId, eventId })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Failed to delete event "${eventId}" from calendar "${calendarId}": ${message}`
    )
  }
}
