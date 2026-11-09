import React from 'react';

/**
 * 1. Vodafone Official Logo (فودافون كاش)
 * Authentic Vodafone Speechmark / Droplet inside the iconic Vodafone Red circle
 */
export const OfficialVodafoneLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
    <img
      src="/assets/images/vodafone_official_logo.png"
      alt="Vodafone"
      className="w-full h-full object-contain select-none"
    />
  </div>
);

/**
 * 2. e& (Etisalat Cash - اتصالات كاش)
 * The official e& Egypt red brand logo
 */
export const OfficialEtisalatLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="22" fill="#E10A17" />
    {/* Official e& lowercase logomark */}
    <g fill="#FFFFFF" transform="translate(10, 15)">
      {/* 'e' */}
      <path
        d="M 32 36 C 32 23 23 15 11 15 C -2 15 -11 25 -11 38 C -11 51 -1 61 12 61 C 22 61 29 55 31 46 L 22 46 C 20 50 16 53 11 53 C 2 53 -3 47 -3 39 L 32 39 C 32 38 32 37 32 36 Z M -3 32 C -2 25 3 22 10 22 C 17 22 22 25 23 32 L -3 32 Z"
        transform="translate(18, 0)"
      />
      {/* '&' */}
      <path
        d="M 64 52 C 60 48 57 44 54 41 C 59 36 62 31 62 25 C 62 17 55 12 46 12 C 38 12 32 17 32 24 C 32 32 39 37 46 41 C 41 46 36 51 32 55 C 29 52 28 49 28 45 L 21 45 C 21 52 24 58 29 62 C 26 65 22 67 17 67 C 9 67 4 62 4 55 C 4 47 11 41 21 41 L 21 34 C 8 34 -3 43 -3 55 C -3 66 5 74 17 74 C 25 74 32 70 36 65 C 41 71 49 74 58 74 C 67 74 74 67 74 58 C 74 51 70 45 64 52 Z M 46 19 C 50 19 54 22 54 26 C 54 30 51 33 47 37 C 42 34 39 30 39 26 C 39 22 42 19 46 19 Z M 57 66 C 50 66 44 61 39 56 C 43 51 47 47 51 43 C 54 46 58 50 61 54 C 64 57 65 60 65 62 C 65 64 62 66 57 66 Z"
        transform="translate(18, -3)"
      />
    </g>
  </svg>
);

/**
 * 3. Orange Official Logo (أورنج موني)
 * The iconic square in official Orange color (#FF7900)
 */
export const OfficialOrangeLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#FF7900" />
    {/* Inner decorative subtle square */}
    <rect x="18" y="18" width="64" height="64" rx="8" fill="#FFFFFF" fillOpacity="0.1" />
    {/* Clean, authentic 'orange' lowercase wordmark */}
    <g fill="#FFFFFF" transform="translate(12, 42)">
      {/* 'o' */}
      <circle cx="10" cy="10" r="7" stroke="#FFFFFF" strokeWidth="3.2" fill="none" />
      {/* 'r' */}
      <path d="M 23 18 V 4 M 23 9 C 25 5 28 4 31 5" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" fill="none" />
      {/* 'a' */}
      <circle cx="41" cy="11" r="6" stroke="#FFFFFF" strokeWidth="3" fill="none" />
      <path d="M 47 5 V 17" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      {/* 'n' */}
      <path d="M 54 18 V 4 M 54 9 C 57 5 62 5 63 9 V 18" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* 'g' */}
      <circle cx="73" cy="11" r="6" stroke="#FFFFFF" strokeWidth="3" fill="none" />
      <path d="M 79 5 V 20 C 79 24 74 25 70 24" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" fill="none" />
    </g>
  </svg>
);

/**
 * 4. InstaPay Egypt Official Logo (إنستاباي IPN)
 * The authentic InstaPay Egypt brand symbol with purple 'i', coral/orange chevrons, 'P', and IPN designation
 */
export const OfficialInstaPayLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="22" fill="#FFFFFF" />
    <rect width="100" height="100" rx="22" stroke="#E2E8F0" strokeWidth="2" />
    
    {/* Dynamic InstaPay Brandmark */}
    <g transform="translate(8, 20)">
      {/* Purple 'i' */}
      <g fill="#37105C">
        <rect x="10" y="2" width="8" height="8" rx="2" transform="skewX(-14)" />
        <rect x="7.5" y="14" width="8" height="23" rx="2.5" transform="skewX(-14)" />
      </g>
      
      {/* Pink/Coral Chevron */}
      <path
        d="M 26 37 L 37 24.5 L 26 12 L 34 12 L 45 24.5 L 34 37 Z"
        fill="#EE3B65"
      />
      
      {/* Orange Chevron */}
      <path
        d="M 38 37 L 49 24.5 L 38 12 L 46 12 L 57 24.5 L 46 37 Z"
        fill="#F67425"
      />
      
      {/* Purple 'P' */}
      <path
        d="M 52 37 L 60 12 H 76 C 82 12 85 15.5 83 22 C 81 28.5 75 32 68 32 H 58.5 L 56.5 37 Z M 64 26 H 69 C 72 26 74.5 24 75.3 20.5 C 75.8 17.5 74 16 71 16 H 66.5 Z"
        fill="#572483"
      />
    </g>

    {/* IPN (Instant Payment Network) Badge at Bottom */}
    <rect x="22" y="72" width="56" height="16" rx="5" fill="#37105C" />
    <text
      x="50"
      y="83.5"
      fill="#FFFFFF"
      fontSize="9"
      fontWeight="900"
      textAnchor="middle"
      fontFamily="system-ui, -apple-system, sans-serif"
      letterSpacing="1"
    >
      IPN · مصر
    </text>
  </svg>
);
