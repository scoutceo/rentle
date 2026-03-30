'use client'

import Image from 'next/image'
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
  const formatRent = (r: number) => '$' + r.toLocaleString()

  const formatBeds = (b: number) =>
    b === 0 ? 'Studio' : b === 1 ? '1 bed' : `${b} beds`

  const cityLabel = apartment.city === 'New York City' ? 'NYC' : apartment.city

  return (
    <button
      type="button"
      onClick={!voted && !disabled ? onVote : undefined}
      disabled={voted || disabled}
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
          src={apartment.photo_url}
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
          <div className="rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white/80 backdrop-blur-md sm:text-xs">
            {apartment.sqft.toLocaleString()} sqft
          </div>
        </div>

        {voted && chosen && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <span className="text-6xl drop-shadow-2xl sm:text-7xl">
              {correct ? '✅' : '❌'}
            </span>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <div className="rounded-[1.35rem] border border-white/10 bg-black/28 p-4 backdrop-blur-md">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[1.9rem] font-black leading-none tracking-tight text-white sm:text-[2.2rem]">
                  {formatRent(apartment.rent_monthly)}
                  <span className="ml-1 text-base font-medium text-white/55 sm:text-lg">/mo</span>
                </p>
                <p className="mt-2 text-sm text-white/80 sm:text-[0.95rem]">
                  {formatBeds(apartment.beds)}
                  <span className="mx-2 text-white/30">·</span>
                  {apartment.baths} bath
                  <span className="mx-2 text-white/30">·</span>
                  {apartment.sqft.toLocaleString()} sqft
                </p>
                <p className="mt-1 truncate text-xs text-white/50 sm:text-sm">
                  {apartment.address_label}
                </p>
              </div>
            </div>

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
              <div className="mt-4 flex items-center justify-between text-sm font-medium text-white/70">
                <span>Tap to vote</span>
                <span className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-xs uppercase tracking-[0.14em] text-teal-300/90">
                  Live pick
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}
