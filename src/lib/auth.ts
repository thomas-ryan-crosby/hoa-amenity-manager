import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export type AppRole =
  | 'resident'
  | 'property_manager'
  | 'janitorial'
  | 'board'

type SessionClaimsWithRole = {
  metadata?: { role?: string }
  public_metadata?: { role?: string }
}

function readRole(sessionClaims: unknown): string | undefined {
  const claims = sessionClaims as SessionClaimsWithRole | undefined
  return claims?.metadata?.role ?? claims?.public_metadata?.role
}

export async function getAuthContext() {
  const authResult = await auth()
  const role = readRole(authResult.sessionClaims)

  return {
    userId: authResult.userId,
    role,
  }
}

export async function requireUser() {
  const { userId, role } = await getAuthContext()

  if (!userId) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 },
      ),
    }
  }

  return {
    ok: true as const,
    userId,
    role,
  }
}

export async function requireRole(allowedRoles: AppRole[]) {
  const authState = await requireUser()
  if (!authState.ok) {
    return authState
  }

  if (!authState.role || !allowedRoles.includes(authState.role as AppRole)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 },
      ),
    }
  }

  return authState
}
