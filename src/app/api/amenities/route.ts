import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'

export async function GET() {
  const amenities = await prisma.amenity.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      capacity: true,
      rentalFee: true,
      depositAmount: true,
      maxAdvanceBookingDays: true,
    },
    orderBy: { name: 'asc' },
  })

  const result = amenities.map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    capacity: a.capacity,
    rentalFee: Number(a.rentalFee),
    depositAmount: Number(a.depositAmount),
    maxAdvanceBookingDays: a.maxAdvanceBookingDays,
  }))

  return NextResponse.json({ amenities: result })
}
