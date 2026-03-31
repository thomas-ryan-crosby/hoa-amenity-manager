import { NextResponse } from 'next/server'
import { getAllAmenities } from '@/lib/firebase/db'

export async function GET() {
  const amenities = await getAllAmenities()

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
