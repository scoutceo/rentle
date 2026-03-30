import { createClient } from '@supabase/supabase-js'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

type ManualListing = {
  city: string
  neighborhood: string
  address_label: string
  rent_monthly: number
  beds: number
  baths: number
  sqft: number
  listing_url: string
  source: string
  source_listing_id?: string
  photo_urls: string[]
}

type ManualListingsFile = {
  listings: ManualListing[]
}

function requireEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

function validateListing(listing: ManualListing): ManualListing {
  const trimmedPhotos = Array.from(new Set(listing.photo_urls.map((u) => u.trim()).filter(Boolean)))

  if (trimmedPhotos.length < 2) {
    throw new Error(`${listing.address_label}: needs at least 2 photos`)
  }

  const hosts = new Set(trimmedPhotos.map((url) => new URL(url).host))
  if (hosts.size > 1) {
    throw new Error(`${listing.address_label}: mixed photo hosts are not allowed on one card`)
  }

  if (!listing.listing_url) {
    throw new Error(`${listing.address_label}: missing listing_url`)
  }

  return {
    ...listing,
    photo_urls: trimmedPhotos.slice(0, 3),
    source_listing_id: listing.source_listing_id || listing.listing_url,
  }
}

async function ensureBucketExists(
  supabase: ReturnType<typeof createClient>,
  bucket: string
) {
  const { data, error } = await supabase.storage.listBuckets()
  if (error) throw new Error(`Could not list storage buckets: ${error.message}`)
  if (data.some((bucketInfo) => bucketInfo.name === bucket)) return

  const { error: createError } = await supabase.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: '10MB',
  })
  if (createError) throw new Error(`Could not create storage bucket ${bucket}: ${createError.message}`)
}

async function uploadPhotos(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  listing: ManualListing
) {
  const uploaded: string[] = []

  for (let i = 0; i < listing.photo_urls.length; i += 1) {
    const sourceUrl = listing.photo_urls[i]
    const response = await fetch(sourceUrl)
    if (!response.ok) {
      throw new Error(`${listing.address_label}: failed downloading photo ${i + 1}`)
    }

    const bytes = new Uint8Array(await response.arrayBuffer())
    const extension = path.extname(new URL(sourceUrl).pathname).replace('.', '') || 'jpg'
    const safeId = Buffer.from(listing.source_listing_id || listing.listing_url)
      .toString('base64')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 48)
    const objectPath = `${listing.source}/${safeId}/${i + 1}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(objectPath, bytes, {
        contentType: response.headers.get('content-type') || 'image/jpeg',
        upsert: true,
      })

    if (uploadError) {
      throw new Error(`${listing.address_label}: upload failed for ${objectPath}: ${uploadError.message}`)
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath)
    uploaded.push(data.publicUrl)
  }

  return uploaded
}

async function main() {
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  const bucket = process.env.PHOTO_BUCKET || 'apartment-photos'
  const inputPath = process.argv[2]

  if (!inputPath) {
    console.log('Usage: npx tsx --env-file=.env.local scripts/manual-ingest-real-listings.ts <json-file>')
    console.log('Expected JSON shape: { "listings": [ ... ] }')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  await ensureBucketExists(supabase, bucket)

  const raw = await readFile(inputPath, 'utf8')
  const parsed = JSON.parse(raw) as ManualListingsFile

  if (!Array.isArray(parsed.listings) || parsed.listings.length === 0) {
    throw new Error('Input file must contain a non-empty `listings` array.')
  }

  for (const entry of parsed.listings) {
    const listing = validateListing(entry)
    console.log(`Uploading ${listing.address_label}...`)

    const hostedPhotos = await uploadPhotos(supabase, bucket, listing)

    const row = {
      city: listing.city,
      neighborhood: listing.neighborhood,
      address_label: listing.address_label,
      rent_monthly: listing.rent_monthly,
      beds: listing.beds,
      baths: listing.baths,
      sqft: listing.sqft,
      photo_url: hostedPhotos[0],
      photo_urls: hostedPhotos,
      listing_url: listing.listing_url,
      source: listing.source,
      source_listing_id: listing.source_listing_id,
      photos_hosted: true,
    }

    const { error } = await supabase
      .from('apartments')
      .upsert(row, {
        onConflict: 'city,neighborhood,address_label',
        ignoreDuplicates: false,
      })

    if (error) {
      throw new Error(`${listing.address_label}: upsert failed: ${error.message}`)
    }

    console.log(`Upserted ${listing.address_label}`)
  }

  console.log('Manual ingestion complete.')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
