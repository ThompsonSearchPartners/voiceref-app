import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  console.log('Looking for ID:', id)

  // Remove .single() to see what we get
  const { data, error } = await supabase
    .from('reference_checks')
    .select('*')
    .eq('id', id)

  console.log('Query result:', { data, error, count: data?.length })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Not found', searched_id: id }, { status: 404 })
  }

  return NextResponse.json(data[0])
}
