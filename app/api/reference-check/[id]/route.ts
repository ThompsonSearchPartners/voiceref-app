import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    console.log('=== API DEBUG START ===')
    console.log('1. Requested ID:', id)
    console.log('2. Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('3. Has Anon Key:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

    // Check if env vars exist
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('ERROR: Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    console.log('4. Querying Supabase...')

    const { data, error } = await supabase
      .from('reference_checks')
      .select('*')
      .eq('id', id)
      .single()

    console.log('5. Supabase response:', { data, error })

    if (error) {
      console.log('ERROR from Supabase:', error)
      return NextResponse.json(
        { error: 'Reference check not found', details: error.message },
        { status: 404 }
      )
    }

    if (!data) {
      console.log('ERROR: No data returned')
      return NextResponse.json(
        { error: 'Reference check not found' },
        { status: 404 }
      )
    }

    console.log('6. SUCCESS - returning data')
    console.log('=== API DEBUG END ===')
    
    return NextResponse.json(data)

  } catch (error) {
    console.error('CATCH ERROR:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
