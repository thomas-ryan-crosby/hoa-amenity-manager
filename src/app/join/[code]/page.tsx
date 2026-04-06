import { redirect } from 'next/navigation'

export default async function JoinWithCodePage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  redirect(`/join?code=${encodeURIComponent(code)}`)
}
