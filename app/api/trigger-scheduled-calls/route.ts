import { NextResponse } from 'next/server'

// Temporarily disabled - will re-enable later
export async function GET() {
  return NextResponse.json({ 
    message: 'Scheduled calls trigger temporarily disabled',
    status: 'ok' 
  })
}
