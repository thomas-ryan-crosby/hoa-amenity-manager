import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSuperAdmin } from '../communities/route'
import { adminAuth } from '@/lib/firebase/admin'

// ---------------------------------------------------------------------------
// GET — list all super admin users
// ---------------------------------------------------------------------------

export async function GET() {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.response

  // Firebase doesn't have a "list by claim" query, so we list all users
  // and filter. For small user bases this is fine.
  const employees: { uid: string; email: string; displayName: string | undefined }[] = []
  let pageToken: string | undefined

  do {
    const result = await adminAuth.listUsers(1000, pageToken)
    for (const user of result.users) {
      if (user.customClaims?.superAdmin) {
        employees.push({
          uid: user.uid,
          email: user.email ?? '',
          displayName: user.displayName,
        })
      }
    }
    pageToken = result.pageToken
  } while (pageToken)

  return NextResponse.json({ employees })
}

// ---------------------------------------------------------------------------
// POST — grant superAdmin to a user by email
// ---------------------------------------------------------------------------

const AddSchema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.response

  const body = await req.json().catch(() => null)
  const parsed = AddSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  try {
    const user = await adminAuth.getUserByEmail(parsed.data.email)
    const existing = user.customClaims ?? {}
    await adminAuth.setCustomUserClaims(user.uid, { ...existing, superAdmin: true })
    return NextResponse.json({
      success: true,
      employee: { uid: user.uid, email: user.email, displayName: user.displayName },
    })
  } catch {
    return NextResponse.json(
      { error: `No account found for ${parsed.data.email}. They must sign up on Neighbri first.` },
      { status: 400 },
    )
  }
}

// ---------------------------------------------------------------------------
// DELETE — revoke superAdmin from a user
// ---------------------------------------------------------------------------

const RemoveSchema = z.object({
  uid: z.string().min(1),
})

export async function DELETE(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.response

  const body = await req.json().catch(() => null)
  const parsed = RemoveSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'uid required' }, { status: 400 })
  }

  // Don't let the last super admin remove themselves
  let adminCount = 0
  let pageToken: string | undefined
  do {
    const result = await adminAuth.listUsers(1000, pageToken)
    for (const user of result.users) {
      if (user.customClaims?.superAdmin) adminCount++
    }
    pageToken = result.pageToken
  } while (pageToken)

  if (adminCount <= 1) {
    return NextResponse.json(
      { error: 'Cannot remove the last Neighbri employee. Add another first.' },
      { status: 400 },
    )
  }

  const user = await adminAuth.getUser(parsed.data.uid)
  const existing = user.customClaims ?? {}
  delete existing.superAdmin
  await adminAuth.setCustomUserClaims(user.uid, existing)

  return NextResponse.json({ success: true })
}
