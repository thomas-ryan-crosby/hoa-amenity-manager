import { NextResponse } from 'next/server'
import { getAllAmenities, getAllAreas } from '@/lib/firebase/db'

export async function GET() {
  const [amenities, areas] = await Promise.all([getAllAmenities(), getAllAreas()])

  // Sort amenities by sortOrder (areas are already sorted by sortOrder from db)
  const sortedAmenities = amenities
    .map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      capacity: a.capacity,
      rentalFee: Number(a.rentalFee),
      depositAmount: Number(a.depositAmount),
      maxAdvanceBookingDays: a.maxAdvanceBookingDays,
      suggestedAmenityIds: a.suggestedAmenityIds ?? [],
      areaId: a.areaId ?? null,
      sortOrder: a.sortOrder ?? 0,
    }))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  return NextResponse.json({ amenities: sortedAmenities, areas })
}
