import React from "react";

// Stylized 3-leaf Aloe Vera Logo
export function LogoIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 4C24 4 17 17 19 32C21 44 24 46 24 46C24 46 27 44 29 32C31 17 24 4 24 4Z" fill="#2d6a4f" />
      <path d="M18 16C18 16 10 23 9 35C8 42 12 44 12 44C12 44 17 40 19 32C20.5 25 18 16 18 16Z" fill="#40916c" opacity="0.9" />
      <path d="M30 16C30 16 38 23 39 35C40 42 36 44 36 44C36 44 31 40 29 32C27.5 25 30 16 30 16Z" fill="#52b788" opacity="0.95" />
    </svg>
  );
}

// Potted Aloe Vera Plant Illustration (Matching Hero & Welcome Card)
export function AloePotGraphic({ width = 240, height = 210 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 320 280" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="haloGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d8f3dc" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#d8f3dc" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="leafGradCenter" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#74c69d" />
          <stop offset="60%" stopColor="#2d6a4f" />
          <stop offset="100%" stopColor="#1b4332" />
        </linearGradient>
        <linearGradient id="potGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e09f67" />
          <stop offset="50%" stopColor="#c57d47" />
          <stop offset="100%" stopColor="#9a5a29" />
        </linearGradient>
      </defs>

      {/* Aura background glow */}
      <circle cx="160" cy="140" r="130" fill="url(#haloGlow)" />

      {/* Center Aloe Leaves */}
      <path d="M160 30 C155 80 145 150 152 185 C158 185 168 185 168 185 C175 150 165 80 160 30 Z" fill="url(#leafGradCenter)" />
      
      {/* Outer Left Leaves */}
      <path d="M145 185 C120 160 85 120 60 90 C75 125 110 165 145 185 Z" fill="#40916c" />
      <path d="M148 185 C115 175 60 165 30 160 C55 178 105 186 148 185 Z" fill="#52b788" />
      <path d="M150 185 C130 140 105 90 95 65 C110 100 135 150 150 185 Z" fill="#2d6a4f" />

      {/* Outer Right Leaves */}
      <path d="M175 185 C200 160 235 120 260 90 C245 125 210 165 175 185 Z" fill="#40916c" />
      <path d="M172 185 C205 175 260 165 290 160 C265 178 215 186 172 185 Z" fill="#52b788" />
      <path d="M170 185 C190 140 215 90 225 65 C210 100 185 150 170 185 Z" fill="#2d6a4f" />

      {/* Terracotta Pot */}
      <ellipse cx="160" cy="188" rx="60" ry="12" fill="#7a421a" />
      <path d="M102 188 L114 245 C116 255 125 262 135 262 L185 262 C195 262 204 255 206 245 L218 188 Z" fill="url(#potGrad)" />
      <ellipse cx="160" cy="188" rx="58" ry="10" fill="#a46234" />
      <ellipse cx="160" cy="190" rx="50" ry="8" fill="#593214" />
      <ellipse cx="160" cy="260" rx="35" ry="6" fill="#7a421a" opacity="0.6" />
    </svg>
  );
}

// Friendly Robot Mascot with Sprout Antenna (Matching Chatbot card)
export function RobotMascotGraphic({ size = 70 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Sprout on head */}
      <path d="M50 20 Q50 8 42 12 Q40 20 50 24" fill="#40916c" />
      <path d="M50 20 Q50 6 58 10 Q60 18 50 24" fill="#52b788" />
      <line x1="50" y1="20" x2="50" y2="28" stroke="#2d6a4f" strokeWidth="3" strokeLinecap="round" />

      {/* Robot Head */}
      <rect x="25" y="28" width="50" height="38" rx="14" fill="#f0fdf4" stroke="#86efac" strokeWidth="2.5" />
      {/* Face Screen */}
      <rect x="32" y="35" width="36" height="22" rx="8" fill="#14532d" />
      {/* Friendly Eyes */}
      <ellipse cx="42" cy="46" rx="3.5" ry="4.5" fill="#4ade80" />
      <ellipse cx="58" cy="46" rx="3.5" ry="4.5" fill="#4ade80" />
      {/* Smile */}
      <path d="M46 51 Q50 54 54 51" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* Cheeks */}
      <circle cx="37" cy="49" r="2" fill="#fca5a5" opacity="0.8" />
      <circle cx="63" cy="49" r="2" fill="#fca5a5" opacity="0.8" />

      {/* Ears/Antenna nubs */}
      <rect x="21" y="42" width="4" height="10" rx="2" fill="#86efac" />
      <rect x="75" y="42" width="4" height="10" rx="2" fill="#86efac" />

      {/* Body */}
      <rect x="34" y="68" width="32" height="24" rx="8" fill="#f0fdf4" stroke="#86efac" strokeWidth="2" />
      <circle cx="50" cy="78" r="4" fill="#22c55e" />
    </svg>
  );
}

// Globe Sprouting Plants (Matching Together for a Greener Tomorrow card)
export function GlobeSproutGraphic({ size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="globeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#81c784" />
          <stop offset="100%" stopColor="#2e7d32" />
        </linearGradient>
      </defs>

      {/* Earth sphere */}
      <circle cx="50" cy="58" r="32" fill="#bbf7d0" stroke="#4ade80" strokeWidth="2" />
      {/* Continents */}
      <path d="M35 50 Q45 42 40 60 Q30 65 35 50 Z" fill="#22c55e" opacity="0.75" />
      <path d="M55 45 Q68 46 62 65 Q50 72 55 45 Z" fill="#22c55e" opacity="0.75" />

      {/* Sprout on top */}
      <path d="M50 36 C45 20 32 18 28 22 C26 32 42 32 50 36 Z" fill="#2d6a4f" />
      <path d="M50 36 C55 18 70 16 74 20 C76 30 58 32 50 36 Z" fill="#52b788" />
      <line x1="50" y1="36" x2="50" y2="28" stroke="#1b4332" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// Waveform Graphic for Voice Assistant
export function VoiceWaveGraphic() {
  return (
    <div className="audio-waves-container">
      {[14, 22, 10, 26, 16, 24, 12, 28, 18, 10, 22, 14, 25].map((h, i) => (
        <div
          key={i}
          className="wave-bar"
          style={{
            height: `${h}px`,
            animationDelay: `${(i * 0.1).toFixed(1)}s`,
          }}
        />
      ))}
    </div>
  );
}

