import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Rentle — The daily apartment value game'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#08080d',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Teal glow */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'rgba(20,184,166,0.12)',
            filter: 'blur(80px)',
          }}
        />
        {/* Amber glow */}
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            left: -80,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'rgba(245,158,11,0.07)',
            filter: 'blur(80px)',
          }}
        />

        {/* Logo */}
        <div
          style={{
            fontSize: 140,
            fontWeight: 900,
            color: 'white',
            letterSpacing: '-6px',
            lineHeight: 1,
            marginBottom: 24,
          }}
        >
          RENTLE
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            color: 'rgba(255,255,255,0.55)',
            fontWeight: 500,
            letterSpacing: '2px',
            marginBottom: 40,
          }}
        >
          The daily apartment value game
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: 22,
            color: 'rgba(255,255,255,0.30)',
            textAlign: 'center',
            maxWidth: 700,
            lineHeight: 1.5,
          }}
        >
          Two real listings. Pick the better deal. See how the crowd voted.
        </div>

        {/* URL badge */}
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(20,184,166,0.12)',
            border: '1px solid rgba(20,184,166,0.25)',
            borderRadius: 999,
            padding: '10px 28px',
            color: 'rgba(20,184,166,0.9)',
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: '1px',
          }}
        >
          rentle.lol
        </div>
      </div>
    ),
    { ...size }
  )
}
