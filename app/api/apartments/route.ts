import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('apartments')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  let body: {
    city: string
    neighborhood: string
    address_label: string
    rent_monthly: number
    beds: number
    baths: number
    sqft: number
    photo_url: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { city, neighborhood, address_label, rent_monthly, beds, baths, sqft, photo_url } = body

  if (!city || !neighborhood || !address_label || !rent_monthly || !beds || !baths || !sqft || !photo_url) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('apartments')
    .insert({ city, neighborhood, address_label, rent_monthly, beds, baths, sqft, photo_url })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
