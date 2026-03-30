import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

function getDateOffset(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

const apartments = [
  // NYC (0-3)
  {
    city: 'New York',
    neighborhood: 'Brooklyn Heights',
    address_label: '45 Pineapple St, Apt 2C, Brooklyn, NY',
    rent_monthly: 3800,
    beds: 1,
    baths: 1,
    sqft: 680,
    photo_url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
  },
  {
    city: 'New York',
    neighborhood: 'Astoria, Queens',
    address_label: '22-14 31st Ave, Apt 4A, Astoria, NY',
    rent_monthly: 2650,
    beds: 2,
    baths: 1,
    sqft: 920,
    photo_url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
  },
  {
    city: 'New York',
    neighborhood: 'Upper West Side',
    address_label: '312 W 79th St, Apt 6D, New York, NY',
    rent_monthly: 4500,
    beds: 1,
    baths: 1,
    sqft: 750,
    photo_url: 'https://images.unsplash.com/photo-1515263487990-61b07816b324?w=800&q=80',
  },
  {
    city: 'New York',
    neighborhood: 'Bushwick',
    address_label: '56 Wyckoff Ave, Unit 2R, Brooklyn, NY',
    rent_monthly: 2400,
    beds: 2,
    baths: 1,
    sqft: 880,
    photo_url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
  },
  // LA (4-7)
  {
    city: 'Los Angeles',
    neighborhood: 'Silver Lake',
    address_label: '2847 Rowena Ave, Apt 101, Los Angeles, CA',
    rent_monthly: 3200,
    beds: 1,
    baths: 1,
    sqft: 750,
    photo_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
  },
  {
    city: 'Los Angeles',
    neighborhood: 'Echo Park',
    address_label: '1420 Glendale Blvd, Unit 5, Los Angeles, CA',
    rent_monthly: 2900,
    beds: 1,
    baths: 1,
    sqft: 700,
    photo_url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
  },
  {
    city: 'Los Angeles',
    neighborhood: 'Koreatown',
    address_label: '3650 W 6th St, Apt 212, Los Angeles, CA',
    rent_monthly: 2200,
    beds: 2,
    baths: 1,
    sqft: 950,
    photo_url: 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&q=80',
  },
  {
    city: 'Los Angeles',
    neighborhood: 'Venice Beach',
    address_label: '18 Breeze Ave, Unit B, Venice, CA',
    rent_monthly: 3800,
    beds: 1,
    baths: 1,
    sqft: 640,
    photo_url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
  },
  // Chicago (8-11)
  {
    city: 'Chicago',
    neighborhood: 'Wicker Park',
    address_label: '1432 N Milwaukee Ave, Unit 3, Chicago, IL',
    rent_monthly: 1950,
    beds: 2,
    baths: 1,
    sqft: 1050,
    photo_url: 'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800&q=80',
  },
  {
    city: 'Chicago',
    neighborhood: 'Logan Square',
    address_label: '2534 N Milwaukee Ave, Apt 1F, Chicago, IL',
    rent_monthly: 1750,
    beds: 2,
    baths: 1,
    sqft: 1100,
    photo_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
  },
  {
    city: 'Chicago',
    neighborhood: 'Lincoln Park',
    address_label: '550 W Belden Ave, Apt 4C, Chicago, IL',
    rent_monthly: 2400,
    beds: 1,
    baths: 1,
    sqft: 820,
    photo_url: 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&q=80',
  },
  {
    city: 'Chicago',
    neighborhood: 'Pilsen',
    address_label: '1814 S Halsted St, Unit 2, Chicago, IL',
    rent_monthly: 1450,
    beds: 2,
    baths: 1,
    sqft: 1150,
    photo_url: 'https://images.unsplash.com/photo-1494526585095-c41746248156?w=800&q=80',
  },
  // Austin (12-15)
  {
    city: 'Austin',
    neighborhood: 'East Austin',
    address_label: '3108 E 6th St, Apt B, Austin, TX',
    rent_monthly: 2100,
    beds: 2,
    baths: 2,
    sqft: 1100,
    photo_url: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&q=80',
  },
  {
    city: 'Austin',
    neighborhood: 'South Congress',
    address_label: '2214 S Congress Ave, Unit 8, Austin, TX',
    rent_monthly: 2400,
    beds: 1,
    baths: 1,
    sqft: 780,
    photo_url: 'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=800&q=80',
  },
  {
    city: 'Austin',
    neighborhood: 'Mueller',
    address_label: '1811 Simond Ave, Apt 203, Austin, TX',
    rent_monthly: 1900,
    beds: 2,
    baths: 2,
    sqft: 1200,
    photo_url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80',
  },
  {
    city: 'Austin',
    neighborhood: 'Hyde Park',
    address_label: '4012 Avenue F, Unit 1, Austin, TX',
    rent_monthly: 1800,
    beds: 1,
    baths: 1,
    sqft: 850,
    photo_url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
  },
  // Seattle (16-19)
  {
    city: 'Seattle',
    neighborhood: 'Capitol Hill',
    address_label: '1623 E Olive Way, Apt 5A, Seattle, WA',
    rent_monthly: 2800,
    beds: 1,
    baths: 1,
    sqft: 700,
    photo_url: 'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&q=80',
  },
  {
    city: 'Seattle',
    neighborhood: 'Fremont',
    address_label: '908 N 34th St, Unit 2, Seattle, WA',
    rent_monthly: 2600,
    beds: 2,
    baths: 1,
    sqft: 950,
    photo_url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
  },
  {
    city: 'Seattle',
    neighborhood: 'Ballard',
    address_label: '5412 22nd Ave NW, Apt 3, Seattle, WA',
    rent_monthly: 2400,
    beds: 2,
    baths: 1,
    sqft: 1000,
    photo_url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
  },
  {
    city: 'Seattle',
    neighborhood: 'South Lake Union',
    address_label: '333 Terry Ave N, Unit 10B, Seattle, WA',
    rent_monthly: 3300,
    beds: 1,
    baths: 1,
    sqft: 720,
    photo_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
  },
]

// 5 pairs per day, each pair uses distinct apartments for that day
// Indexes into the apartments array above
const dailyPairDefs = [
  // Today: NYC vs LA matchups, Chicago vs Austin, Seattle matchup
  [
    [0, 4],   // Brooklyn Heights vs Silver Lake
    [1, 8],   // Astoria vs Wicker Park
    [2, 12],  // Upper West Side vs East Austin
    [9, 16],  // Logan Square vs Capitol Hill
    [6, 14],  // Koreatown vs Mueller
  ],
  // Tomorrow: different cross-city matchups
  [
    [3, 5],   // Bushwick vs Echo Park
    [7, 13],  // Venice Beach vs South Congress
    [10, 17], // Lincoln Park vs Fremont
    [15, 19], // Hyde Park vs South Lake Union
    [11, 18], // Pilsen vs Ballard
  ],
  // Day after: mix of remaining/reuse
  [
    [0, 9],   // Brooklyn Heights vs Logan Square
    [4, 12],  // Silver Lake vs East Austin
    [8, 16],  // Wicker Park vs Capitol Hill
    [2, 19],  // Upper West Side vs South Lake Union
    [6, 10],  // Koreatown vs Lincoln Park
  ],
]

async function seed() {
  console.log('🌱 Seeding apartments...')

  const { error: aptUpsertError } = await supabase
    .from('apartments')
    .upsert(apartments, { onConflict: 'city,neighborhood,address_label', ignoreDuplicates: true })

  if (aptUpsertError) {
    console.error('Error upserting apartments:', aptUpsertError.message)
    process.exit(1)
  }

  const { data: insertedApts, error: aptFetchError } = await supabase
    .from('apartments')
    .select('id, address_label')
    .in('address_label', apartments.map((a) => a.address_label))

  if (aptFetchError || !insertedApts) {
    console.error('Error fetching apartments:', aptFetchError?.message)
    process.exit(1)
  }

  if (insertedApts.length !== apartments.length) {
    console.error(`Expected ${apartments.length} apartments, got ${insertedApts.length}`)
    process.exit(1)
  }

  const aptById = Object.fromEntries(insertedApts.map((a) => [a.address_label, a.id]))
  // Re-map insertedApts to match original order
  const orderedApts = apartments.map((a) => ({ id: aptById[a.address_label] }))

  console.log(`✅ Upserted ${insertedApts.length} apartments`)

  const pairs: Array<{
    date: string
    round_number: number
    apartment_a_id: string
    apartment_b_id: string
  }> = []

  for (let dayOffset = 0; dayOffset < dailyPairDefs.length; dayOffset++) {
    const date = getDateOffset(dayOffset)
    const dayPairs = dailyPairDefs[dayOffset]
    for (let round = 0; round < dayPairs.length; round++) {
      const [aIdx, bIdx] = dayPairs[round]
      pairs.push({
        date,
        round_number: round + 1,
        apartment_a_id: orderedApts[aIdx].id,
        apartment_b_id: orderedApts[bIdx].id,
      })
    }
  }

  console.log('🌱 Seeding daily pairs...')

  const { error: pairError } = await supabase
    .from('daily_pairs')
    .upsert(pairs, { onConflict: 'date,round_number', ignoreDuplicates: true })

  if (pairError) {
    console.error('Error upserting pairs:', pairError.message)
    process.exit(1)
  }

  console.log(`✅ Upserted ${pairs.length} daily pairs`)
  console.log('')
  console.log('📅 Scheduled (5 rounds each):')
  for (let i = 0; i < dailyPairDefs.length; i++) {
    console.log(`  ${getDateOffset(i)} → 5 rounds`)
  }
  console.log('')
  console.log('🎉 Seed complete! Run: npm run dev')
}

seed()
