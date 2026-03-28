'use client'

import Image from 'next/image'
import { Apartment } from '@/lib/supabase'

type Props = {
  apartment: Apartment
  side: 'A' | 'B'
  voted: boolean
  chosen: boolean
  correct: boolean | null
  votePercent: number | null
  onVote: () => void
  disabled: boolean
}

export default function ApartmentCard({
  apartment,
  side,
  voted,
  chosen,
  correct,
  votePercent,
  onVote,
  disabled,
}: Props) {
  const formatRent = (r: number) =>
    '$' + r.toLocaleString()

  const formatBeds = (b: number) =>
    b === 0 ? 'Studio' : b === 1 ? '1 bed' : `${b} beds`

  return (
    <div
      onClick={!voted && !disabled ? onVote : undefined}
      className={`relative flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 ${
        chosen && correct
          ? 'border-teal-400 shadow-[0_0_24px_rgba(20,184,166,0.35)]'
          : chosen && !correct
          ? 'border-red-500 shadow-[0_0_24px_rgba(239,68,68,0.25)]'
          : !voted && !disabled
          ? 'border-white/10 shadow-lg hover:border-teal-400/50 hover:shadow-[0_0_20px_rgba(20,184,166,0.15)] cursor-pointer'
          : 'border-white/10 shadow-lg'
      } bg-[#1a1a1a]`}
    >
      {/* Photo */}
      <div className="relative w-full aspect-[4/3] bg-[#111]">
        <Image
          src={apartment.photo_url}
          alt={apartment.address_label}
          fill
          className="object-cover"
          unoptimized
        />
        {/* City badge */}
        <span className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
          {apartment.city}
        </span>
        {/* Result overlay */}
        {voted && chosen && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl drop-shadow-2xl">
              {correct ? '✅' : '❌'}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        <div>
          <p className="text-white font-bold text-xl leading-tight">
            {formatRent(apartment.rent_monthly)}
            <span className="text-white/50 font-normal text-sm">/mo</span>
          </p>
          <p className="text-white/60 text-sm mt-0.5">{apartment.neighborhood}</p>
        </div>

        <div className="flex items-center gap-3 text-white/70 text-sm">
          <span>{formatBeds(apartment.beds)}</span>
          <span className="text-white/30">·</span>
          <span>{apartment.baths} bath</span>
          <span className="text-white/30">·</span>
          <span>{apartment.sqft.toLocaleString()} sqft</span>
        </div>

        <p className="text-white/40 text-xs truncate">{apartment.address_label}</p>

        {/* Vote bar or button */}
        {voted ? (
          <div className="mt-auto pt-3">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className={chosen ? 'text-teal-400 font-semibold' : 'text-white/50'}>
                {votePercent}% picked this
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  chosen ? 'bg-teal-400' : 'bg-white/30'
                }`}
                style={{ width: `${votePercent}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="mt-auto pt-2 flex items-center justify-center gap-1.5 text-teal-400/70 text-sm font-medium">
            <span>Tap to vote</span>
          </div>
        )}
      </div>
    </div>
  )
}
