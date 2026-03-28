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
    city: 'Chicago',
    neighborhood: 'Wicker Park',
    address_label: '1432 N Milwaukee Ave, Unit 3, Chicago, IL',
    rent_monthly: 1950,
    beds: 2,
    baths: 1,
    sqft: 1050,
    photo_url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
  },
  {
    city: 'Austin',
    neighborhood: 'East Austin',
    address_label: '3108 E 6th St, Apt B, Austin, TX',
    rent_monthly: 2100,
    beds: 2,
    baths: 2,
    sqft: 1100,
    photo_url: 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&q=80',
  },
]

async function seed() {
  console.log('🌱 Seeding apartments...')

  const { data: insertedApts, error: aptError } = await supabase
    .from('apartments')
    .insert(apartments)
    .select()

  if (aptError) {
    console.error('Error inserting apartments:', aptError.message)
    process.exit(1)
  }

  if (!insertedApts || insertedApts.length !== apartments.length) {
    console.error('Unexpected number of apartments inserted')
    process.exit(1)
  }

  console.log(`✅ Inserted ${insertedApts.length} apartments`)

  const today = getDateOffset(0)
  const tomorrow = getDateOffset(1)
  const dayAfter = getDateOffset(2)

  const pairs = [
    {
      date: today,
      apartment_a_id: insertedApts[0].id, // NYC Brooklyn Heights 1bd
      apartment_b_id: insertedApts[2].id, // LA Silver Lake 1bd
    },
    {
      date: tomorrow,
      apartment_a_id: insertedApts[1].id, // NYC Astoria 2bd
      apartment_b_id: insertedApts[3].id, // Chicago Wicker Park 2bd
    },
    {
      date: dayAfter,
      apartment_a_id: insertedApts[3].id, // Chicago Wicker Park 2bd
      apartment_b_id: insertedApts[4].id, // Austin East Austin 2bd
    },
  ]

  console.log('🌱 Seeding daily pairs...')

  const { data: insertedPairs, error: pairError } = await supabase
    .from('daily_pairs')
    .insert(pairs)
    .select()

  if (pairError) {
    console.error('Error inserting pairs:', pairError.message)
    process.exit(1)
  }

  console.log(`✅ Inserted ${insertedPairs?.length} daily pairs`)
  console.log('')
  console.log('📅 Scheduled:')
  console.log(`  ${today}     → NYC Brooklyn Heights vs LA Silver Lake`)
  console.log(`  ${tomorrow}  → NYC Astoria vs Chicago Wicker Park`)
  console.log(`  ${dayAfter}  → Chicago Wicker Park vs Austin East Austin`)
  console.log('')
  console.log('🎉 Seed complete! Run: npm run dev')
}

seed()
