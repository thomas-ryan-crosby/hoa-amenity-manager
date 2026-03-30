import { Worker, Job } from 'bullmq'
import { getRedisConnection, QUEUE_NAME } from './reminder-jobs'
import * as residentAgent from '@/lib/agents/resident-agent'
import * as janitorialAgent from '@/lib/agents/janitorial-agent'

interface ReminderJobData {
  bookingId: string
}

let worker: Worker | null = null

export function startWorker(): Worker {
  if (worker) return worker

  worker = new Worker<ReminderJobData>(
    QUEUE_NAME,
    async (job: Job<ReminderJobData>) => {
      const { bookingId } = job.data
      console.log(`[Worker] Processing job ${job.name} for booking ${bookingId}`)

      switch (job.name) {
        case 'send-48hr-reminder':
          await Promise.allSettled([
            residentAgent.send48hrReminder(bookingId),
            janitorialAgent.notifyJobAssigned(bookingId),
          ])
          break

        case 'post-event-followup':
          await Promise.allSettled([
            janitorialAgent.sendInspectionReminder(bookingId),
            residentAgent.sendPostEventFollowUp(bookingId),
          ])
          break

        default:
          console.warn(`[Worker] Unknown job type: ${job.name}`)
      }
    },
    {
      connection: getRedisConnection(),
      concurrency: 5,
    },
  )

  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed (${job.name})`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed (${job?.name}):`, err.message)
  })

  console.log(`[Worker] BullMQ worker started for queue "${QUEUE_NAME}"`)
  return worker
}
