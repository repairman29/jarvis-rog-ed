import { NextRequest, NextResponse } from 'next/server'

const KROGER_SERVICE = process.env.NEXT_PUBLIC_KROGER_SERVICE_URL
const SERVICE_SECRET = process.env.KROGER_SERVICE_SECRET

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId') || 'default'

  try {
    const res = await fetch(`${KROGER_SERVICE}/api/status/${userId}`, {
      headers: { 'X-API-Secret': SERVICE_SECRET! },
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ connected: false, error: e.message })
  }
}
