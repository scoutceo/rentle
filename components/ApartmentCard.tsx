'use client'

import Image from 'next/image'
import { useMemo, useRef, useState } from 'react'
import { Apartment } from '@/lib/supabase'

type Props = {
  apartment: Apartment
  voted: boolean
  chosen: boolean
  correct: boolean | null
  votePercent: number | null
  onVote: () => void
  disabled: boolean
}

export default function ApartmentCard({
  apartment,
  voted,
  chosen,
  correct,
  votePercent,
  onVote,
  disabled,
}: Props) {
  const [photoIndex, setPhotoIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const touchDeltaX = useRef(0)
  const touchDeltaY = useRef(0)
  const swipeHandled = useRef(false)

  const photos = useMemo(() => {
    const urls = apartment.photo_urls?.filter(Boolean) ?? []
    return urls.length > 0 ? urls : [apartment.photo_url]
  }, [apartment.photo_url, apartment.photo_urls])

  const formatRent = (r: number) => '$' + r.toLocaleString()

  const formatBeds = (b: number) =>
    b === 0 ? 'Studio' : b === 1 ? '1 bed' : `${b} beds`

  const cityLabel = apartment.city === 'New York City' ? 'NYC' : apartment.city

  const goPrev = () => {
    setPhotoIndex((current) => (current === 0 ? photos.length - 1 : current - 1))
  }

  const goNext = () => {
    setPhotoIndex((current) => (current === photos.length - 1 ? 0 : current + 1))
  }

  const handleCardClick = () => {
    if (swipeHandled.current) {
      swipeHandled.current = false
      return
    }
    if (!voted && !disabled) onVote()
  }

  return (
    <div
      role="button"
      tabIndex={voted || disabled ? -1 : 0}
      onClick={handleCardClick}
      onKeyDown={(event) => {
        if ((event.key === 'Enter' || event.key === ' ') && !voted && !disabled) {
          event.preventDefault()
          onVote()
        }
      }}
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0]?.clientX ?? null
        touchStartY.current = event.touches[0]?.clientY ?? null
        touchDeltaX.current = 0
        touchDeltaY.current = 0
        swipeHandled.current = false
      }}
      onTouchMove={(event) => {
        if (touchStartX.current === null || touchStartY.current === null) return
        touchDeltaX.current = (event.touches[0]?.clientX ?? 0) - touchStartX.current
        touchDeltaY.current = (event.touches[0]?.clientY ?? 0) - touchStartY.current
      }}
      onTouchEnd={() => {
        const horizontalSwipe = Math.abs(touchDeltaX.current) > 35 && Math.abs(touchDeltaX.current) > Math.abs(touchDeltaY.current) * 1.2
        if (horizontalSwipe) {
          swipeHandled.current = true
          if (touchDeltaX.current < 0) goNext()
          else goPrev()
        }
        touchStartX.current = null
        touchStartY.current = null
        touchDeltaX.current = 0
        touchDeltaY.current = 0
      }}
      className={`group relative isolate w-full overflow-hidden rounded-[1.75rem] border text-left transition-all duration-300 ${
        chosen && correct
          ? 'border-teal-400 shadow-[0_0_28px_rgba(20,184,166,0.35)]'
          : chosen && !correct
            ? 'border-red-500 shadow-[0_0_28px_rgba(239,68,68,0.25)]'
            : !voted && !disabled
              ? 'cursor-pointer border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.35)] hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_24px_72px_rgba(0,0,0,0.45)] active:scale-[0.99]'
              : 'border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.35)]'
      } bg-[#111]`}
    >
      <div className="relative aspect-[5/6] w-full bg-[#111]">
        <Image
          src={photos[photoIndex]}
          alt={apartment.address_label}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          unoptimized
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-black/85" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.10),transparent_42%)]" />

        <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[1.05rem] font-semibold leading-tight text-white drop-shadow-md sm:text-lg">
              {apartment.neighborhood}
            </p>
            <p className="mt-0.5 text-xs font-medium uppercase tracking-[0.18em] text-white/65">
              {cityLabel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {photos.length > 1 && (
              <div className="rounded-full border border-white/15 bg-black/35 px-2 py-1 text-[11px] font-medium text-white/80 backdrop-blur-md sm:text-xs">
                {photoIndex + 1}/{photos.length}
              </div>
            )}
            <div className="rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white/80 backdrop-blur-md sm:text-xs">
              {apartment.sqft.toLocaleString()} sqft
            </div>
          </div>
        </div>

        {photos.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={(event) => {
                event.stopPropagation()
                goPrev()
              }}
              className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/35 text-white/80 backdrop-blur-md transition hover:bg-black/50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={(event) => {
                event.stopPropagation()
                goNext()
              }}
              className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/35 text-white/80 backdrop-blur-md transition hover:bg-black/50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {voted && chosen && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <span className="text-6xl drop-shadow-2xl sm:text-7xl">
              {correct ? '✅' : '❌'}
            </span>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-5">
          <div className="rounded-[1.1rem] sm:rounded-[1.35rem] border border-white/10 bg-black/28 p-3 sm:p-4 backdrop-blur-md">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[1.55rem] font-black leading-none tracking-tight text-white sm:text-[2.2rem]">
                  {formatRent(apartment.rent_monthly)}
                  <span className="ml-1 text-sm font-medium text-white/55 sm:text-lg">/mo</span>
                </p>
                <p className="mt-1.5 text-[13px] text-white/80 sm:mt-2 sm:text-[0.95rem]">
                  {formatBeds(apartment.beds)}
                  <span className="mx-1.5 sm:mx-2 text-white/30">·</span>
                  {apartment.baths} bath
                  <span className="mx-1.5 sm:mx-2 text-white/30">·</span>
                  {apartment.sqft.toLocaleString()} sqft
                </p>
                <p className="mt-1 truncate text-[11px] text-white/50 sm:text-sm">
                  {apartment.address_label}
                </p>
              </div>
            </div>

            {photos.length > 1 && (
              <div className="mt-3 flex items-center justify-center gap-1.5">
                {photos.map((_, index) => (
                  <span
                    key={index}
                    className={`h-1.5 rounded-full transition-all ${index === photoIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/35'}`}
                  />
                ))}
              </div>
            )}

            {voted ? (
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className={chosen ? 'font-semibold text-teal-300' : 'text-white/55'}>
                    {votePercent}% picked this
                  </span>
                  {chosen && (
                    <span className={`text-xs font-semibold uppercase tracking-[0.14em] ${correct ? 'text-teal-300' : 'text-red-300'}`}>
                      {correct ? 'majority' : 'minority'}
                    </span>
                  )}
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${chosen ? 'bg-teal-400' : 'bg-white/30'}`}
                    style={{ width: `${votePercent ?? 0}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-3 sm:mt-4 flex items-center justify-between text-xs sm:text-sm font-medium text-white/70">
                <span>{photos.length > 1 ? 'Swipe or tap arrows for more photos' : 'Tap to vote'}</span>
                <span className="rounded-full border border-white/10 bg-white/8 px-2 py-1 text-[10px] sm:px-2.5 sm:text-xs uppercase tracking-[0.14em] text-teal-300/90">
                  Live pick
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
