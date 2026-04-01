import { Queue } from 'bullmq'
import IORedis from 'ioredis'

let connection: IORedis | null = null

function getRedisConnection(): IORedis | null {
  if (!process.env.REDIS_URL) return null
  if (!connection) {
    connection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
  }
  return connection
}

const QUEUE_NAME = 'booking-reminders'

let queue: Queue | null = null

function getQueue(): Queue | null {
  const conn = getRedisConnection()
  if (!conn) return null
  if (!queue) {
    queue = new Queue(QUEUE_NAME, { connection: conn })
  }
  return queue
}

export { getRedisConnection, QUEUE_NAME }

export async function scheduleReminder(
  bookingId: string,
  startDatetime: Date,
): Promise<void> {
  const q = getQueue()
  if (!q) {
    console.log(`[Queue] Skipping 48hr reminder for ${bookingId} (no Redis)`)
    return
  }

  const fortyEightHoursMs = 48 * 60 * 60 * 1000
  const delay = startDatetime.getTime() - fortyEightHoursMs - Date.now()

  await q.add(
    'send-48hr-reminder',
    { bookingId },
    {
      delay: Math.max(delay, 0),
      jobId: `reminder-48hr-${bookingId}`,
      removeOnComplete: true,
      removeOnFail: 50,
    },
  )

  console.log(
    `[Queue] Scheduled 48hr reminder for ${bookingId} (delay: ${Math.max(delay, 0)}ms)`,
  )
}

export async function schedulePostEventFollowup(
  bookingId: string,
  endDatetime: Date,
): Promise<void> {
  const q = getQueue()
  if (!q) {
    console.log(`[Queue] Skipping post-event followup for ${bookingId} (no Redis)`)
    return
  }

  const twoHoursMs = 2 * 60 * 60 * 1000
  const delay = endDatetime.getTime() + twoHoursMs - Date.now()

  await q.add(
    'post-event-followup',
    { bookingId },
    {
      delay: Math.max(delay, 0),
      jobId: `followup-${bookingId}`,
      removeOnComplete: true,
      removeOnFail: 50,
    },
  )

  console.log(
    `[Queue] Scheduled post-event followup for ${bookingId} (delay: ${Math.max(delay, 0)}ms)`,
  )
}

export async function cancelScheduledJobs(bookingId: string): Promise<void> {
  const q = getQueue()
  if (!q) return

  const reminderJob = await q.getJob(`reminder-48hr-${bookingId}`)
  const followupJob = await q.getJob(`followup-${bookingId}`)

  if (reminderJob) await reminderJob.remove()
  if (followupJob) await followupJob.remove()

  console.log(`[Queue] Cancelled scheduled jobs for ${bookingId}`)
}
