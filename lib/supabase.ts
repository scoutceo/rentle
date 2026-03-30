import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }
    _client = createClient(url, key)
  }
  return _client
}

// Convenience proxy — mirrors the old `supabase` export but is lazily initialized
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

export type Apartment = {
  id: string
  city: string
  neighborhood: string
  address_label: string
  rent_monthly: number
  beds: number
  baths: number
  sqft: number
  photo_url: string
  photo_urls?: string[] | null
  source?: string | null
  source_listing_id?: string | null
  listing_url?: string | null
  photos_hosted?: boolean | null
  created_at: string
}

export type DailyPair = {
  id: string
  date: string
  round_number: number
  apartment_a_id: string
  apartment_b_id: string
  created_at: string
}

export type Vote = {
  id: string
  pair_id: string
  choice: 'A' | 'B'
  created_at: string
}

export type PairWithApartments = {
  id: string
  date: string
  apartment_a: Apartment
  apartment_b: Apartment
  votes_a: number
  votes_b: number
}
