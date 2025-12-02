import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ FIX: Await params for Next.js 14
    const { id } = await context.params

    console.log('API: Fetching reference check with ID:', id)

    // Query Supabase
    const { data, error } = await supabase
      .from('reference_checks')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      console.log('API: Reference check not found:', error)
      return NextResponse.json(
        { error: 'Reference check not found' },
        { status: 404 }
      )
    }

    console.log('API: Reference check found:', data)
    return NextResponse.json(data)

  } catch (error) {
    console.error('API: Error fetching reference check:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
