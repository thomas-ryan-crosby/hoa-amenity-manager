import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { adminStorage } from '@/lib/firebase/admin'
import { getAmenityById, updateAmenity } from '@/lib/firebase/db'

// ---------------------------------------------------------------------------
// POST — upload a photo for an amenity
// ---------------------------------------------------------------------------

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(['property_manager'])
  if (!auth.ok) return auth.response

  const { id } = await params
  const amenity = await getAmenityById(id)
  if (!amenity) {
    return NextResponse.json({ error: 'Amenity not found' }, { status: 404 })
  }

  const formData = await req.formData()
  const file = formData.get('photo') as File
  if (!file) {
    return NextResponse.json({ error: 'No photo provided' }, { status: 400 })
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File must be under 5MB' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = file.name.split('.').pop() ?? 'jpg'
  const fileName = `amenities/${id}/${Date.now()}.${ext}`

  const bucket = adminStorage.bucket()
  const fileRef = bucket.file(fileName)

  await fileRef.save(buffer, {
    metadata: { contentType: file.type },
  })

  // Make the file publicly readable
  await fileRef.makePublic()

  const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`

  // Add to amenity's photos array
  const currentPhotos = amenity.photos ?? []
  await updateAmenity(id, { photos: [...currentPhotos, downloadUrl] })

  return NextResponse.json({ url: downloadUrl }, { status: 201 })
}

// ---------------------------------------------------------------------------
// DELETE — remove a photo from an amenity
// ---------------------------------------------------------------------------

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(['property_manager'])
  if (!auth.ok) return auth.response

  const { id } = await params
  const amenity = await getAmenityById(id)
  if (!amenity) {
    return NextResponse.json({ error: 'Amenity not found' }, { status: 404 })
  }

  const { url } = await req.json()
  if (!url) {
    return NextResponse.json({ error: 'URL required' }, { status: 400 })
  }

  // Remove from Firestore
  const currentPhotos = amenity.photos ?? []
  await updateAmenity(id, { photos: currentPhotos.filter((p) => p !== url) })

  // Try to delete from Storage
  try {
    const bucket = adminStorage.bucket()
    const path = url.split(`${bucket.name}/`)[1]
    if (path) await bucket.file(path).delete()
  } catch {
    // File may already be deleted — ignore
  }

  return NextResponse.json({ success: true })
}
