import { NextResponse } from 'next/server'

// This is the old webhook - replaced by app/api/vapi/webhook/route.ts
export async function POST() {
  return NextResponse.json({ message: 'Old webhook - use /api/vapi/webhook instead' })
}
