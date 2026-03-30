import { createClient } from '@supabase/supabase-js'

type SourceListing = {
  source: string
  sourceListingId: string
  listingUrl: string
  city: string
  neighborhood: string
  addressLabel: string
  rentMonthly: number
  beds: number
  baths: number
  sqft: number
  photoUrls: string[]
}

type Env = {
  NEXT_PUBLIC_SUPABASE_URL?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
  RENTCAST_API_KEY?: string
  RENTCAST_BASE_URL?: string
  RENTCAST_CITY?: string
  RENTCAST_STATE?: string
  PHOTO_BUCKET?: string
}

function getEnv(): Env {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    RENTCAST_API_KEY: process.env.RENTCAST_API_KEY,
    RENTCAST_BASE_URL: process.env.RENTCAST_BASE_URL || 'https://api.rentcast.io/v1',
    RENTCAST_CITY: process.env.RENTCAST_CITY,
    RENTCAST_STATE: process.env.RENTCAST_STATE,
    PHOTO_BUCKET: process.env.PHOTO_BUCKET || 'apartment-photos',
  }
}

function assertCoreEnv(env: Env) {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.')
  }
}

function hasProviderConfig(env: Env) {
  return Boolean(env.RENTCAST_API_KEY && env.RENTCAST_CITY && env.RENTCAST_STATE)
}

function normalizeNeighborhood(input: string) {
  return input.trim() || 'Unknown'
}

function normalizePhotoUrls(urls: string[]) {
  return Array.from(new Set(urls.map((url) => url.trim()).filter(Boolean)))
}

function validateListing(listing: SourceListing) {
  const normalized = normalizePhotoUrls(listing.photoUrls)

  if (normalized.length < 2) {
    return { ok: false as const, reason: 'needs at least 2 photos' }
  }

  const hosts = new Set(normalized.map((url) => {
    try {
      return new URL(url).host
    } catch {
      return 'invalid'
    }
  }))

  if (hosts.has('invalid')) {
    return { ok: false as const, reason: 'contains invalid photo URL' }
  }

  if (hosts.size > 1) {
    return { ok: false as const, reason: 'mixes photo hosts on one listing' }
  }

  return {
    ok: true as const,
    listing: {
      ...listing,
      neighborhood: normalizeNeighborhood(listing.neighborhood),
      photoUrls: normalized.slice(0, 3),
    },
  }
}

async function fetchRentcastListings(env: Env): Promise<SourceListing[]> {
  if (!env.RENTCAST_API_KEY || !env.RENTCAST_CITY || !env.RENTCAST_STATE) {
    return []
  }

  const query = new URLSearchParams({
    city: env.RENTCAST_CITY,
    state: env.RENTCAST_STATE,
    status: 'Active',
    limit: '25',
  })

  const url = `${env.RENTCAST_BASE_URL}/listings/rental/long-term?${query.toString()}`
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'X-Api-Key': env.RENTCAST_API_KEY,
    },
  })

  if (!response.ok) {
    throw new Error(`Rentcast request failed (${response.status} ${response.statusText}).`)
  }

  const raw = await response.json()
  if (!Array.isArray(raw)) {
    throw new Error('Rentcast response was not an array.')
  }

  return raw.flatMap((item) => {
    const addressLabel = [item.addressLine1, item.city, item.state].filter(Boolean).join(', ')
    const photos = Array.isArray(item.photos)
      ? item.photos
          .map((photo: unknown) => {
            if (typeof photo === 'string') return photo
            if (photo && typeof photo === 'object' && 'url' in photo && typeof photo.url === 'string') {
              return photo.url
            }
            return null
          })
          .filter((photo: string | null): photo is string => Boolean(photo))
      : []

    if (!item.id || !item.city || !addressLabel) {
      return []
    }

    return [{
      source: 'rentcast',
      sourceListingId: String(item.id),
      listingUrl: typeof item.listingUrl === 'string' ? item.listingUrl : '',
      city: String(item.city),
      neighborhood: typeof item.neighborhood === 'string' ? item.neighborhood : String(item.city),
      addressLabel,
      rentMonthly: Number(item.price ?? item.rent ?? 0),
      beds: Number(item.bedrooms ?? 0),
      baths: Number(item.bathrooms ?? 0),
      sqft: Number(item.squareFootage ?? item.sqft ?? 0),
      photoUrls: photos,
    } satisfies SourceListing]
  })
}

async function uploadPhotosAndReturnUrls(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  listing: SourceListing
) {
  const uploaded: string[] = []

  for (let index = 0; index < listing.photoUrls.length; index += 1) {
    const sourceUrl = listing.photoUrls[index]
    const response = await fetch(sourceUrl)
    if (!response.ok) {
      throw new Error(`Failed downloading photo ${index + 1} for ${listing.sourceListingId}.`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    const pathname = new URL(sourceUrl).pathname
    const extension = pathname.split('.').pop()?.split('?')[0] || 'jpg'
    const path = `${listing.source}/${listing.sourceListingId}/${index + 1}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, bytes, {
        contentType: response.headers.get('content-type') || 'image/jpeg',
        upsert: true,
      })

    if (uploadError) {
      throw new Error(`Storage upload failed for ${path}: ${uploadError.message}`)
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    uploaded.push(data.publicUrl)
  }

  return uploaded
}

async function ensureBucketExists(
  supabase: ReturnType<typeof createClient>,
  bucket: string
) {
  const { data: buckets, error } = await supabase.storage.listBuckets()
  if (error) {
    throw new Error(`Could not list storage buckets: ${error.message}`)
  }

  const exists = buckets.some((item) => item.name === bucket)
  if (exists) return

  const { error: createError } = await supabase.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: '10MB',
  })

  if (createError) {
    throw new Error(`Could not create storage bucket ${bucket}: ${createError.message}`)
  }
}

async function main() {
  const env = getEnv()
  assertCoreEnv(env)

  if (!hasProviderConfig(env)) {
    console.log('No provider config found. Nothing ingested.')
    console.log('Set RENTCAST_API_KEY, RENTCAST_CITY, and RENTCAST_STATE to ingest real listings.')
    process.exit(0)
  }

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!)
  await ensureBucketExists(supabase, env.PHOTO_BUCKET!)

  console.log(`Fetching candidate listings for ${env.RENTCAST_CITY}, ${env.RENTCAST_STATE}...`)
  const candidates = await fetchRentcastListings(env)
  console.log(`Fetched ${candidates.length} candidate listings.`)

  const valid = candidates
    .map(validateListing)
    .filter((result): result is Extract<typeof result, { ok: true }> => result.ok)
    .map((result) => result.listing)

  console.log(`Validated ${valid.length} listings with 2+ same-host photos.`)

  if (valid.length === 0) {
    console.log('No valid listings found. Check provider payload shape / photo availability.')
    process.exit(0)
  }

  for (const listing of valid) {
    console.log(`Uploading photos for ${listing.addressLabel}...`)
    const hostedPhotoUrls = await uploadPhotosAndReturnUrls(supabase, env.PHOTO_BUCKET!, listing)

    const row = {
      city: listing.city,
      neighborhood: listing.neighborhood,
      address_label: listing.addressLabel,
      rent_monthly: listing.rentMonthly,
      beds: listing.beds,
      baths: listing.baths,
      sqft: listing.sqft,
      photo_url: hostedPhotoUrls[0],
      photo_urls: hostedPhotoUrls,
      source: listing.source,
      source_listing_id: listing.sourceListingId,
      listing_url: listing.listingUrl || null,
      photos_hosted: true,
    }

    const { error } = await supabase
      .from('apartments')
      .upsert(row, {
        onConflict: 'city,neighborhood,address_label',
        ignoreDuplicates: false,
      })

    if (error) {
      throw new Error(`Failed upserting ${listing.addressLabel}: ${error.message}`)
    }

    console.log(`Upserted ${listing.addressLabel}`)
  }

  console.log('Done.')
  console.log('Next step: generate daily pairs filtered to real-source apartments only.')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
