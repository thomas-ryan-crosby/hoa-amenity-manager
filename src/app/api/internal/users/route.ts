import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '../communities/route'
import { adminDb } from '@/lib/firebase/admin'
import { Timestamp } from 'firebase-admin/firestore'

// ---------------------------------------------------------------------------
// GET — list/search all users across all communities
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.response

  const { searchParams } = req.nextUrl
  const query = searchParams.get('q')?.trim().toLowerCase() ?? ''
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '50')))

  // Get all residents + memberships
  const [residentsSnap, membersSnap] = await Promise.all([
    adminDb.collection('residents').get(),
    adminDb.collection('communityMembers').get(),
  ])

  const members = membersSnap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      communityId: data.communityId as string,
      userId: data.userId as string,
      residentId: data.residentId as string,
      role: data.role as string,
      status: data.status as string,
      unitNumber: data.unitNumber as string,
      joinedAt:
        data.joinedAt instanceof Timestamp
          ? data.joinedAt.toDate().toISOString()
          : (data.joinedAt as string),
    }
  })

  // Build user records from residents
  type UserRecord = {
    id: string
    firebaseUid: string
    name: string
    email: string
    phone: string | null
    createdAt: string
    memberships: typeof members
  }

  let users: UserRecord[] = residentsSnap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      firebaseUid: (data.firebaseUid ?? '') as string,
      name: (data.name ?? '') as string,
      email: (data.email ?? '') as string,
      phone: (data.phone ?? null) as string | null,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : ((data.createdAt as string) ?? ''),
      memberships: members.filter((m) => m.residentId === d.id),
    }
  })

  // Sort: most recent first
  users.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  // Filter by search query (name or email)
  if (query) {
    users = users.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.firebaseUid.toLowerCase().includes(query),
    )
  }

  const total = users.length
  const offset = (page - 1) * limit
  const paged = users.slice(offset, offset + limit)

  return NextResponse.json({
    users: paged,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  })
}
