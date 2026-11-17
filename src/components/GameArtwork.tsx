import React, { useState } from 'react';

interface GameArtworkProps {
  theme: string;
  title: string;
  imageUrl?: string;
  className?: string;
}

const THEME_PALETTES: Record<
  string,
  { bg1: string; bg2: string; accent: string; secondary: string; label: string }
> = {
  cyberpunk: { bg1: '#091128', bg2: '#1B113A', accent: '#00E5FF', secondary: '#F43F5E', label: 'Night City' },
  elden: { bg1: '#15120C', bg2: '#2C2212', accent: '#F59E0B', secondary: '#D97706', label: 'Tierras Intermedias' },
  hogwarts: { bg1: '#0D1829', bg2: '#1C2E4A', accent: '#38BDF8', secondary: '#FBBF24', label: 'Mundo Mágico' },
  rdr2: { bg1: '#1C0E0C', bg2: '#3B1914', accent: '#F97316', secondary: '#FACC15', label: 'Frontera 1899' },
  gow: { bg1: '#081826', bg2: '#102C42', accent: '#38BDF8', secondary: '#E2E8F0', label: 'Nueve Reinos' },
  witcher: { bg1: '#11161F', bg2: '#232C3D', accent: '#EF4444', secondary: '#94A3B8', label: 'El Continente' },
  hollow: { bg1: '#090D18', bg2: '#162038', accent: '#7DD3FC', secondary: '#E0F2FE', label: 'Hallownest' },
  fc26: { bg1: '#061B1A', bg2: '#0B352F', accent: '#00E5FF', secondary: '#22C55E', label: 'Estadio Global' },
  re4: { bg1: '#140B0E', bg2: '#2B1219', accent: '#EF4444', secondary: '#FCA5A5', label: 'Survival Horror' },
  genshin: { bg1: '#0C1B33', bg2: '#1A345C', accent: '#38BDF8', secondary: '#FDE047', label: 'Teyvat' },
  hades2: { bg1: '#0E1726', bg2: '#1F2B47', accent: '#22D3EE', secondary: '#A855F7', label: 'Inframundo' },
  forza5: { bg1: '#191124', bg2: '#361A3D', accent: '#FB7185', secondary: '#00E5FF', label: 'Horizon Festival' },
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
      <div className={`relative overflow-hidden bg-[#0D1322] ${className}`}>
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
          <radialGradient id={`glow-${baseKey}`} cx="65%" cy="35%" r="60%">
            <stop offset="0%" stopColor={palette.accent} stopOpacity="0.32" />
            <stop offset="60%" stopColor={palette.secondary} stopOpacity="0.1" />
            <stop offset="100%" stopColor={palette.bg1} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`floor-${baseKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.bg1} stopOpacity="0" />
            <stop offset="100%" stopColor="#070A12" stopOpacity="0.88" />
          </linearGradient>
        </defs>

        <rect width="640" height="400" fill={palette.bg1} />
        <rect width="640" height="400" fill={`url(#glow-${baseKey})`} />

        {/* Subtle geometric grid */}
        <g stroke={palette.accent} strokeOpacity="0.08" strokeWidth="1">
          <line x1="0" y1="80" x2="640" y2="80" />
          <line x1="0" y1="160" x2="640" y2="160" />
          <line x1="0" y1="240" x2="640" y2="240" />
          <line x1="160" y1="0" x2="160" y2="400" />
          <line x1="320" y1="0" x2="320" y2="400" />
          <line x1="480" y1="0" x2="480" y2="400" />
        </g>

        {/* Theme-specific bespoke layered vector illustration */}
        {baseKey === 'witcher' && (
          <g>
            <circle cx="430" cy="145" r="78" fill="none" stroke={palette.accent} strokeOpacity="0.35" strokeWidth="2" />
            <path d="M90 360 L210 190 L290 270 L390 150 L560 360 Z" fill="#0B0F19" fillOpacity="0.7" />
            {/* Twin witcher swords silhouette */}
            <g transform="translate(320 190) rotate(-25)" stroke="#E2E8F0" strokeWidth="4" strokeLinecap="round">
              <line x1="0" y1="-120" x2="0" y2="95" />
              <line x1="-26" y1="50" x2="26" y2="50" stroke={palette.accent} />
            </g>
            <g transform="translate(320 190) rotate(25)" stroke="#94A3B8" strokeWidth="4" strokeLinecap="round">
              <line x1="0" y1="-120" x2="0" y2="95" />
              <line x1="-26" y1="50" x2="26" y2="50" stroke={palette.accent} />
            </g>
          </g>
        )}

        {baseKey === 'hollow' && (
          <g>
            <ellipse cx="320" cy="175" rx="180" ry="120" fill={palette.accent} fillOpacity="0.08" />
            <path d="M60 360 Q180 260 320 310 T580 350 L640 400 L0 400 Z" fill="#070A12" />
            {/* Masked knight silhouette */}
            <path
              d="M275 110 C268 70 292 60 302 95 L338 95 C348 60 372 70 365 110 C376 135 365 170 320 175 C275 170 264 135 275 110 Z"
              fill="#F1F5F9"
            />
            <ellipse cx="300" cy="136" rx="9" ry="14" fill="#0B0F19" />
            <ellipse cx="340" cy="136" rx="9" ry="14" fill="#0B0F19" />
            <path d="M292 174 L270 258 L320 245 L370 258 L348 174 Z" fill="#1E293B" />
            <circle cx="150" cy="120" r="3" fill={palette.accent} />
            <circle cx="495" cy="95" r="4" fill={palette.accent} />
            <circle cx="525" cy="165" r="2.5" fill="#E0F2FE" />
          </g>
        )}

        {baseKey === 'hogwarts' && (
          <g>
            <circle cx="475" cy="96" r="46" fill={palette.secondary} fillOpacity="0.22" />
            <circle cx="475" cy="96" r="32" fill={palette.secondary} fillOpacity="0.7" />
            {/* Castle spires */}
            <path
              d="M120 360 L120 220 L145 140 L170 220 L210 220 L210 170 L240 90 L270 170 L270 205 L320 185 L350 110 L380 185 L410 220 L455 155 L490 220 L490 360 Z"
              fill="#080E1A"
            />
            {/* Glowing castle windows */}
            <rect x="236" y="160" width="8" height="16" rx="4" fill={palette.secondary} />
            <rect x="346" y="185" width="8" height="16" rx="4" fill={palette.secondary} />
            <rect x="142" y="210" width="6" height="12" rx="3" fill={palette.accent} />
            <rect x="452" y="220" width="6" height="12" rx="3" fill={palette.secondary} />
          </g>
        )}

        {baseKey === 'fc26' && (
          <g>
            {/* Stadium pitch arcs & floodlights */}
            <ellipse cx="320" cy="310" rx="260" ry="90" fill="none" stroke={palette.accent} strokeOpacity="0.35" strokeWidth="2.5" />
            <circle cx="320" cy="295" r="46" fill="none" stroke={palette.secondary} strokeOpacity="0.4" strokeWidth="2" />
            <polygon points="110,40 240,260 180,260" fill={palette.accent} fillOpacity="0.08" />
            <polygon points="530,40 400,260 460,260" fill={palette.secondary} fillOpacity="0.08" />
            <circle cx="110" cy="40" r="8" fill="#F8FAFC" />
            <circle cx="530" cy="40" r="8" fill="#F8FAFC" />
            <circle cx="320" cy="175" r="34" fill="none" stroke="#F8FAFC" strokeOpacity="0.7" strokeWidth="2.5" />
            <polygon points="320,152 338,166 331,188 309,188 302,166" fill={palette.accent} fillOpacity="0.45" />
          </g>
        )}

        {baseKey === 're4' && (
          <g>
            {/* Blood moon & twisted village silhouettes */}
            <circle cx="430" cy="115" r="56" fill={palette.accent} fillOpacity="0.28" />
            <circle cx="430" cy="115" r="38" fill={palette.accent} fillOpacity="0.65" />
            <path d="M0 360 L0 250 L90 210 L130 255 L195 160 L225 255 L340 265 L420 205 L490 265 L640 230 L640 360 Z" fill="#090609" />
            <line x1="210" y1="125" x2="210" y2="170" stroke={palette.secondary} strokeWidth="2" strokeOpacity="0.5" />
            <line x1="196" y1="140" x2="224" y2="140" stroke={palette.secondary} strokeWidth="2" strokeOpacity="0.5" />
          </g>
        )}

        {baseKey === 'genshin' && (
          <g>
            {/* Floating sky islands & four-point star */}
            <path d="M120 210 L240 210 L205 265 L155 255 Z" fill="#0B162C" />
            <path d="M400 165 L540 165 L500 225 L430 215 Z" fill="#0B162C" />
            <path d="M320 65 L332 108 L375 120 L332 132 L320 175 L308 132 L265 120 L308 108 Z" fill={palette.secondary} fillOpacity="0.85" />
            <circle cx="320" cy="120" r="68" fill="none" stroke={palette.accent} strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="6 6" />
          </g>
        )}

        {baseKey === 'hades2' && (
          <g>
            {/* Crescent moon & arcane sigils */}
            <path d="M355 75 A70 70 0 1 0 355 215 A54 54 0 1 1 355 75 Z" fill={palette.accent} fillOpacity="0.8" />
            <circle cx="320" cy="150" r="98" fill="none" stroke={palette.secondary} strokeOpacity="0.38" strokeWidth="2" />
            <polygon points="320,62 396,195 244,195" fill="none" stroke={palette.accent} strokeOpacity="0.45" strokeWidth="2" />
          </g>
        )}

        {baseKey === 'forza5' && (
          <g>
            {/* Horizon sun stripes & desert highway */}
            <circle cx="320" cy="170" r="88" fill={palette.accent} fillOpacity="0.7" />
            <rect x="210" y="180" width="220" height="8" fill={palette.bg1} />
            <rect x="210" y="198" width="220" height="10" fill={palette.bg1} />
            <rect x="210" y="218" width="220" height="14" fill={palette.bg1} />
            <polygon points="290,240 350,240 520,400 120,400" fill="#0B0F19" />
            <line x1="320" y1="245" x2="320" y2="395" stroke={palette.secondary} strokeWidth="3" strokeDasharray="16 14" />
          </g>
        )}

        {['cyberpunk', 'elden', 'gow', 'rdr2'].includes(baseKey) && (
          <g>
            <circle cx="320" cy="160" r="85" fill={palette.accent} fillOpacity="0.18" />
            <path d="M0 320 L140 210 L260 285 L410 180 L550 270 L640 220 L640 400 L0 400 Z" fill="#080C15" />
          </g>
        )}

        <rect width="640" height="400" fill={`url(#floor-${baseKey})`} />
      </svg>
    </div>
  );
};
