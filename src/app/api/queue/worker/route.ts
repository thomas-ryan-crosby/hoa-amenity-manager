import { NextResponse } from 'next/server'
import { startWorker } from '@/lib/queue/post-event-jobs'

let started = false

export async function GET() {
  if (!started) {
    startWorker()
    started = true
    return NextResponse.json({ status: 'Worker started' })
  }
  return NextResponse.json({ status: 'Worker already running' })
}
