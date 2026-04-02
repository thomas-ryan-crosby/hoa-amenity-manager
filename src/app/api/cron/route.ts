import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { Timestamp } from 'firebase-admin/firestore'
import * as residentAgent from '@/lib/agents/resident-agent'
import * as janitorialAgent from '@/lib/agents/janitorial-agent'

/**
 * Vercel Cron Job — runs every hour.
 * Checks for bookings that need:
 * 1. 48-hour reminder (confirmed, starts within 48hrs, not yet reminded)
 * 2. Post-event follow-up (confirmed/completed, ended 2+ hrs ago, not yet followed up)
 */
export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const results = { reminders: 0, followups: 0, access: 0, errors: 0 }

  // --- 48-hour reminders ---
  // Find CONFIRMED bookings starting within the next 48 hours
  // that haven't been reminded yet
  const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000)

  try {
    const reminderSnap = await adminDb
      .collection('bookings')
      .where('status', 'in', ['CONFIRMED', 'REMINDER_SENT'])
      .get()

    for (const doc of reminderSnap.docs) {
      const data = doc.data()
      if (data.status !== 'CONFIRMED') continue // only remind once
      if (data.reminderSent) continue

      const startTime = data.startDatetime instanceof Timestamp
        ? data.startDatetime.toDate()
        : new Date(data.startDatetime)

      // Within 48 hours but not past
      if (startTime <= fortyEightHoursFromNow && startTime > now) {
        try {
          await residentAgent.send48hrReminder(doc.id)
          await janitorialAgent.notifyJobAssigned(doc.id)
          await adminDb.collection('bookings').doc(doc.id).update({
            reminderSent: true,
            status: 'REMINDER_SENT',
          })
          results.reminders++
          console.log(`[Cron] 48hr reminder sent for booking ${doc.id}`)
        } catch (err) {
          results.errors++
          console.error(`[Cron] Reminder failed for ${doc.id}:`, err)
        }
      }
    }
  } catch (err) {
    console.error('[Cron] Reminder query failed:', err)
  }

  // --- Access instructions (1hr before) ---
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)

  try {
    const accessSnap = await adminDb
      .collection('bookings')
      .where('status', 'in', ['CONFIRMED', 'REMINDER_SENT'])
      .get()

    for (const doc of accessSnap.docs) {
      const data = doc.data()
      if (data.accessInstructionsSent) continue

      const startTime = data.startDatetime instanceof Timestamp
        ? data.startDatetime.toDate()
        : new Date(data.startDatetime)

      if (startTime <= oneHourFromNow && startTime > now) {
        try {
          await residentAgent.sendAccessInstructions(doc.id)
          await adminDb.collection('bookings').doc(doc.id).update({
            accessInstructionsSent: true,
          })
          results.access++
          console.log(`[Cron] Access instructions sent for booking ${doc.id}`)
        } catch (err) {
          results.errors++
          console.error(`[Cron] Access instructions failed for ${doc.id}:`, err)
        }
      }
    }
  } catch (err) {
    console.error('[Cron] Access instructions query failed:', err)
  }

  // --- Post-event follow-ups ---
  // Find bookings that ended 2+ hours ago and haven't been followed up
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)

  try {
    const followupSnap = await adminDb
      .collection('bookings')
      .where('status', 'in', ['CONFIRMED', 'REMINDER_SENT', 'IN_PROGRESS'])
      .get()

    for (const doc of followupSnap.docs) {
      const data = doc.data()
      if (data.followupSent) continue

      const endTime = data.endDatetime instanceof Timestamp
        ? data.endDatetime.toDate()
        : new Date(data.endDatetime)

      if (endTime <= twoHoursAgo) {
        try {
          await residentAgent.sendPostEventFollowUp(doc.id)
          await janitorialAgent.sendInspectionReminder(doc.id)
          await adminDb.collection('bookings').doc(doc.id).update({
            followupSent: true,
            status: 'COMPLETED',
          })
          results.followups++
          console.log(`[Cron] Post-event followup sent for booking ${doc.id}`)
        } catch (err) {
          results.errors++
          console.error(`[Cron] Followup failed for ${doc.id}:`, err)
        }
      }
    }
  } catch (err) {
    console.error('[Cron] Followup query failed:', err)
  }

  console.log(`[Cron] Complete: ${results.reminders} reminders, ${results.access} access instructions, ${results.followups} followups, ${results.errors} errors`)

  return NextResponse.json({
    ok: true,
    ...results,
    timestamp: now.toISOString(),
  })
}
