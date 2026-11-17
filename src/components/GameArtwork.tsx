import React, { useState } from 'react';

interface GameArtworkProps {
  theme: string;
  title: string;
  imageUrl?: string;
  className?: string;
}

const THEME_PALETTES: Record<
  string,
  { bg1: string; bg2: string; accent: string; secondary: string }
> = {
  cyberpunk: { bg1: '#1A110C', bg2: '#3B1B10', accent: '#EA580C', secondary: '#F59E0B' },
  elden: { bg1: '#17110B', bg2: '#2F2212', accent: '#F59E0B', secondary: '#D97706' },
  hogwarts: { bg1: '#1B130E', bg2: '#3B2314', accent: '#FBBF24', secondary: '#EA580C' },
  rdr2: { bg1: '#1C0E0C', bg2: '#3B1914', accent: '#F97316', secondary: '#FACC15' },
  gow: { bg1: '#18110D', bg2: '#362116', accent: '#F59E0B', secondary: '#E7E5E4' },
  witcher: { bg1: '#1A120E', bg2: '#331D17', accent: '#EF4444', secondary: '#D6C7BA' },
  hollow: { bg1: '#15100D', bg2: '#2A1D16', accent: '#FDBA74', secondary: '#FAF5F0' },
  fc26: { bg1: '#14120B', bg2: '#2B2411', accent: '#F59E0B', secondary: '#84CC16' },
  re4: { bg1: '#180B0C', bg2: '#331215', accent: '#DC2626', secondary: '#FCA5A5' },
  genshin: { bg1: '#1A130D', bg2: '#3B2714', accent: '#FBBF24', secondary: '#FB923C' },
  hades2: { bg1: '#1B0F0D', bg2: '#3A1916', accent: '#F97316', secondary: '#FDE047' },
  forza5: { bg1: '#1D110F', bg2: '#3E1C1A', accent: '#FB7185', secondary: '#F59E0B' },
};

export const GameArtwork: React.FC<GameArtworkProps> = ({
  theme,
  title,
  imageUrl,
  className = '',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  if (imageUrl && !imgFailed) {
    return (
      <div className={`relative overflow-hidden bg-[#150F0B] ${className}`}>
        <img
          src={imageUrl}
          alt={title}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
    );
  }

  const baseKey = theme.split('-')[0];
  const palette = THEME_PALETTES[baseKey] ?? THEME_PALETTES.cyberpunk;

  return (
    <div
      className={`relative overflow-hidden select-none ${className}`}
      style={{
        background: `linear-gradient(135deg, ${palette.bg1} 0%, ${palette.bg2} 100%)`,
      }}
      role="img"
      aria-label={title}
    >
      <svg
        viewBox="0 0 640 400"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={`warm-glow-${baseKey}`} cx="65%" cy="35%" r="60%">
            <stop offset="0%" stopColor={palette.accent} stopOpacity="0.34" />
            <stop offset="60%" stopColor={palette.secondary} stopOpacity="0.12" />
            <stop offset="100%" stopColor={palette.bg1} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`warm-floor-${baseKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.bg1} stopOpacity="0" />
            <stop offset="100%" stopColor="#0D0806" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        <rect width="640" height="400" fill={palette.bg1} />
        <rect width="640" height="400" fill={`url(#warm-glow-${baseKey})`} />

        <g stroke={palette.accent} strokeOpacity="0.09" strokeWidth="1">
          <line x1="0" y1="80" x2="640" y2="80" />
          <line x1="0" y1="160" x2="640" y2="160" />
          <line x1="0" y1="240" x2="640" y2="240" />
          <line x1="160" y1="0" x2="160" y2="400" />
          <line x1="320" y1="0" x2="320" y2="400" />
          <line x1="480" y1="0" x2="480" y2="400" />
        </g>

        <circle cx="430" cy="145" r="78" fill="none" stroke={palette.accent} strokeOpacity="0.35" strokeWidth="2" />
        <path d="M0 320 L140 210 L260 285 L410 180 L550 270 L640 220 L640 400 L0 400 Z" fill="#0F0A07" />
        <rect width="640" height="400" fill={`url(#warm-floor-${baseKey})`} />
      </svg>
    </div>
  );
};
