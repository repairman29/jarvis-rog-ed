import { NextRequest, NextResponse } from 'next/server'

const KROGER_SERVICE = process.env.NEXT_PUBLIC_KROGER_SERVICE_URL

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId') || 'default'

  try {
    const res = await fetch(`${KROGER_SERVICE}/auth/url?user_id=${userId}`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
