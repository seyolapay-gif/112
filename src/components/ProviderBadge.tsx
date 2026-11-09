import React from 'react';
import { ProviderType } from '../types';

interface ProviderBadgeProps {
  provider: ProviderType;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  className?: string;
}

// 1. Vodafone Cash (فودافون كاش - الشعار الرسمي المعتمد لشركة فودافون)
export const VodafoneCashIcon: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    <img
      src="/assets/images/vodafone_official_logo.png"
      alt="فودافون كاش"
      className="w-full h-full object-contain select-none"
    />
  </div>
);

// Re-export OfficialVodafoneLogo for uniform universal usage
export const OfficialVodafoneLogo = VodafoneCashIcon;

// 1.1 Vodafone VIP Icon (شعار فودافون المعتمد مع وسم VIP الذهبي)
export const VodafoneVipIcon: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    <img
      src="/assets/images/vodafone_official_logo.png"
      alt="فودافون VIP"
      className="w-full h-full object-contain select-none"
    />
    {/* Gold VIP Ribbon Tag in bottom corner */}
    <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-[9px] rounded-md border border-amber-300 shadow-md">
      VIP
    </span>
  </div>
);

// 2. Etisalat Cash (اتصالات كاش - طبقاً للصورة رقم 2 المرفقة: خلفية سوداء وإطار أبيض وكلمة ca$h بعلامة الدولار الخضراء)
export const EtisalatCashIcon: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Pure Black Rounded Card Container */}
    <rect width="100" height="100" rx="22" fill="#000000" />
    
    {/* White "etisalat" text at the top */}
    <text
      x="50"
      y="35"
      fill="#FFFFFF"
      fontSize="17"
      fontWeight="700"
      textAnchor="middle"
      fontFamily="system-ui, -apple-system, sans-serif"
      letterSpacing="-0.3"
    >
      etisalat
    </text>
    
    {/* White outline rounded box framing "ca$h" */}
    <path
      d="M 28 34 H 19 C 15.1 34 12 37.1 12 41 V 66 C 12 69.9 15.1 73 19 73 H 81 C 84.9 73 88 69.9 88 66 V 41 C 88 37.1 84.9 34 81 34 H 72"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth="2.8"
      strokeLinecap="round"
    />
    
    {/* "ca" in white, "$" in lime-green, "h" in white */}
    <g transform="translate(0, 63)">
      {/* 'c' */}
      <text
        x="30"
        y="0"
        fill="#FFFFFF"
        fontSize="27"
        fontWeight="800"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        c
      </text>
      {/* 'a' */}
      <text
        x="44"
        y="0"
        fill="#FFFFFF"
        fontSize="27"
        fontWeight="800"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        a
      </text>
      {/* '$' in bright lime green */}
      <text
        x="58"
        y="0"
        fill="#7BC143"
        fontSize="30"
        fontWeight="900"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        $
      </text>
      {/* 'h' */}
      <text
        x="72"
        y="0"
        fill="#FFFFFF"
        fontSize="27"
        fontWeight="800"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        h
      </text>
    </g>
  </svg>
);

// 3. Orange Cash (أورنج كاش - طبقاً للصورة رقم 3 المرفقة: السهم الأسود والسهم البرتقالي مع كلمة اورنج كاش بالعربي)
export const OrangeCashIcon: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Light Grayish/White Card Background */}
    <rect width="100" height="100" rx="20" fill="#EEEEEE" />
    
    {/* Left Black Arrow pointing UP-RIGHT (↗) */}
    <g fill="#000000">
      <path
        d="M 23 41.5 L 34.5 30 L 40.5 36 L 40.5 13 L 17.5 13 L 23.5 19 L 12 30.5 C 10 32.5 10 35.5 12 37.5 L 16 41.5 C 18 43.5 21 43.5 23 41.5 Z"
        fill="#000000"
      />
    </g>
    
    {/* Right Orange Arrow pointing DOWN-LEFT (↙) */}
    <g fill="#FF6600">
      <path
        d="M 77 18.5 L 65.5 30 L 59.5 24 L 59.5 47 L 82.5 47 L 76.5 41 L 88 29.5 C 90 27.5 90 24.5 88 22.5 L 84 18.5 C 82 16.5 79 16.5 77 18.5 Z"
        fill="#FF6600"
      />
    </g>
    
    {/* Arabic Text "اورنج" on first line, "كاش" on second line */}
    <text
      x="50"
      y="67"
      fill="#000000"
      fontSize="17"
      fontWeight="900"
      textAnchor="middle"
      fontFamily="'Cairo', system-ui, -apple-system, sans-serif"
    >
      اورنج
    </text>
    <text
      x="50"
      y="87"
      fill="#000000"
      fontSize="17"
      fontWeight="900"
      textAnchor="middle"
      fontFamily="'Cairo', system-ui, -apple-system, sans-serif"
    >
      كاش
    </text>
  </svg>
);

// 4. WE Pay (وي كاش / وي باي - طبقاً للصورة رقم 4 المرفقة: شعار we الرمادي المائل مع هاتف بنفسجي مائل وكلمة Pay بخط مميز)
export const WePayIcon: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Light Gray Card Background */}
    <rect width="100" height="100" rx="20" fill="#EDEDED" />
    
    {/* Top "we" Gray Elegant Wordmark */}
    <g transform="translate(18, 12)">
      {/* 'w' */}
      <path
        d="M 6 18 C 8 8 13 3 19 3 C 25 3 28 9 30 18 C 32 9 36 3 42 3 C 48 3 53 8 55 18"
        stroke="#5A5B5E"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* 'e' */}
      <path
        d="M 68 10 C 64 10 60 12 59 15 H 73 C 73 11 68 7 62 7 C 55 7 51 12 51 19 C 51 25 56 29 63 29 C 69 29 73 26 73 22"
        stroke="#5A5B5E"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
    </g>
    
    {/* Bottom Tilted Purple Smartphone with "Pay" */}
    <g transform="rotate(-7 50 67)">
      {/* Purple Phone Body */}
      <rect x="12" y="46" width="76" height="42" rx="10" fill="#6A227D" />
      
      {/* Inner Screen Outline */}
      <rect x="16" y="50" width="68" height="34" rx="4" fill="none" stroke="#FFFFFF" strokeWidth="1.6" opacity="0.85" />
      
      {/* Camera Dot & Speaker Slit */}
      <circle cx="14" cy="67" r="1.8" fill="#FFFFFF" opacity="0.9" />
      <line x1="86" y1="63" x2="86" y2="71" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" opacity="0.9" />
      
      {/* Cursive Stylized White "Pay" Wordmark */}
      <text
        x="50"
        y="75"
        fill="#FFFFFF"
        fontSize="24"
        fontWeight="900"
        fontStyle="italic"
        textAnchor="middle"
        fontFamily="'Brush Script MT', 'Segoe Script', cursive, sans-serif"
        letterSpacing="0.5"
      >
        Pay
      </text>
    </g>
  </svg>
);

// 5. InstaPay Egypt IPN (إنستاباي - طبقاً للصورة رقم 5 المرفقة: حرف i البنفسجي، سهمين مائلين بالوردي والبرتقالي، حرف P، وكلمة INSTAPAY)
export const InstaPayIcon: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Crisp White Card Background */}
    <rect width="100" height="100" rx="20" fill="#FFFFFF" />
    
    {/* Symbol Top Group */}
    <g transform="translate(10, 18)">
      {/* 1. Purple Slanted 'i' */}
      <g fill="#431868">
        <rect x="9" y="1" width="9" height="9" rx="2" transform="skewX(-16)" />
        <rect x="6.5" y="14" width="9" height="23" rx="2.5" transform="skewX(-16)" />
      </g>
      
      {/* 2. Salmon / Coral Pink Chevron Arrow */}
      <path
        d="M 27 37 L 38 24.5 L 27 12 L 35 12 L 46 24.5 L 35 37 Z"
        fill="#F67468"
      />
      
      {/* 3. Vibrant Orange Chevron Arrow */}
      <path
        d="M 39 37 L 50 24.5 L 39 12 L 47 12 L 58 24.5 L 47 37 Z"
        fill="#FF6400"
      />
      
      {/* 4. Purple Slanted 'P' */}
      <path
        d="M 52 37 L 60 12 H 78 C 84 12 87 15.5 85 22 C 83 28.5 77 32 70 32 H 58.5 L 56.5 37 Z M 64 26 H 70 C 73.5 26 76 24 76.8 20.5 C 77.4 17.5 75.5 16 72 16 H 67 Z"
        fill="#663A82"
      />
    </g>
    
    {/* Bottom Wordmark: "INSTAPAY" in bold italic purple */}
    <text
      x="50"
      y="79"
      fill="#431868"
      fontSize="13"
      fontWeight="900"
      fontStyle="italic"
      textAnchor="middle"
      fontFamily="system-ui, -apple-system, sans-serif"
      letterSpacing="0.6"
    >
      INSTAPAY
    </text>
  </svg>
);

// 6. Banque Misr (بنك مصر - الختم الذهبي مع شعار الغزال وقرص الشمس التاريخي والخلفية القرمزية)
export const BanqueMisrIcon: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#8B1D2C" />
    {/* Gold ornamental border */}
    <circle cx="50" cy="46" r="34" stroke="#D4AF37" strokeWidth="2.5" strokeDasharray="6 3" />
    <circle cx="50" cy="46" r="28" fill="#6A1320" />
    {/* Gazelle / Deer emblem in gold */}
    <g fill="#D4AF37">
      <circle cx="50" cy="30" r="5" fill="#FFDF00" />
      <path d="M 50 20 V 25 M 42 22 L 45 26 M 58 22 L 55 26" stroke="#FFDF00" strokeWidth="2" strokeLinecap="round" />
      <path d="M 40 56 C 43 53 47 48 50 42 C 52 48 56 53 60 56 C 54 55 46 55 40 56 Z" />
      <path d="M 47 37 C 45 37 43 39 43 41 S 45 43 47 43 C 50 43 52 41 53 38 C 51 37 49 37 47 37 Z" />
      <path d="M 46 36 C 45 32 43 29 40 27 M 51 36 C 52 32 54 29 57 27" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
    </g>
    {/* Arabic text 'بنك مصر' */}
    <rect x="18" y="74" width="64" height="18" rx="8" fill="#4A0C14" />
    <text x="50" y="87" fill="#FFDF00" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="'Cairo', sans-serif">
      بنك مصر
    </text>
  </svg>
);

// 7. CIB (البنك التجاري الدولي - القوس البرتقالي المميز مع الحروف البيضاء على خلفية كحلية)
export const CibIcon: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#0A2540" />
    {/* Iconic CIB Orange Arch / Loop */}
    <path
      d="M 18 48 C 18 30 32 16 50 16 C 58 16 65 19 71 24 L 64 31 C 60 27 55 25 50 25 C 37 25 26 36 26 48 C 26 61 37 72 50 72 C 55 72 60 70 64 66 L 71 73 C 65 78 58 81 50 81 C 32 81 18 67 18 48 Z"
      fill="#F37021"
    />
    {/* Bold CIB letters */}
    <text
      x="50"
      y="55"
      fill="#FFFFFF"
      fontSize="24"
      fontWeight="900"
      textAnchor="middle"
      fontFamily="system-ui, -apple-system, sans-serif"
      letterSpacing="1"
    >
      CIB
    </text>
    {/* Commercial International Bank mini label */}
    <text
      x="50"
      y="91"
      fill="#94A3B8"
      fontSize="8"
      fontWeight="700"
      textAnchor="middle"
      fontFamily="system-ui, -apple-system, sans-serif"
    >
      COMMERCIAL INTL
    </text>
  </svg>
);

// 8. NBE (البنك الأهلي المصري - الشعار الأخضر والختم الدائري لزهرة اللوتس الذهبية)
export const NbeIcon: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#006338" />
    {/* Golden seal circles */}
    <circle cx="50" cy="45" r="33" stroke="#C8A051" strokeWidth="2.5" />
    <circle cx="50" cy="45" r="28" stroke="#C8A051" strokeWidth="1.5" strokeDasharray="3 3" />
    {/* Golden Egyptian Lotus emblem */}
    <g fill="#C8A051" transform="translate(50, 45)">
      <path d="M 0 -17 C 3.5 -10 5 -2 0 12 C -5 -2 -3.5 -10 0 -17 Z" />
      <path d="M -3.5 -13 C -10.5 -8 -12 0 -5 10 C -5 2 -3.5 -6 -3.5 -13 Z" />
      <path d="M 3.5 -13 C 10.5 -8 12 0 5 10 C 5 2 3.5 -6 3.5 -13 Z" />
      <path d="M -14 13 C -5 17 5 17 14 13 C 9 20 -9 20 -14 13 Z" fill="#FFDF00" />
    </g>
    {/* Arabic text 'الأهلي المصري' */}
    <rect x="16" y="74" width="68" height="18" rx="8" fill="#004326" />
    <text x="50" y="87" fill="#FFDF00" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="'Cairo', sans-serif">
      الأهلي المصري
    </text>
  </svg>
);

// 9. Fawry (فوري للمدفوعات الإلكترونية - الأصفر والأزرق المميز)
export const FawryIcon: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#FFCC00" />
    {/* Blue circle and dynamic payment swoosh bird */}
    <g transform="translate(20, 16)">
      <circle cx="30" cy="24" r="21" fill="#003399" />
      <path
        d="M 14 34 C 21 20 37 12 49 20 C 44 29 28 39 14 34 Z"
        fill="#FFCC00"
      />
      <circle cx="37" cy="18" r="4.5" fill="#FFFFFF" />
    </g>
    <rect x="18" y="71" width="64" height="20" rx="9" fill="#003399" />
    <text x="50" y="86" fill="#FFCC00" fontSize="14" fontWeight="900" textAnchor="middle" fontFamily="'Cairo', sans-serif">
      فــــوري
    </text>
  </svg>
);

// 10. Banque du Caire (بنك القاهرة - الأزرق والذهبي مع شعار أشعة الشمس)
export const BanqueDuCaireIcon: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#0E2748" />
    {/* Gold Sun & Rays Emblem */}
    <circle cx="50" cy="42" r="16" fill="#D4AF37" />
    <g stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round">
      <line x1="50" y1="18" x2="50" y2="23" />
      <line x1="50" y1="61" x2="50" y2="66" />
      <line x1="26" y1="42" x2="31" y2="42" />
      <line x1="69" y1="42" x2="74" y2="42" />
      <line x1="33" y1="25" x2="37" y2="29" />
      <line x1="67" y1="25" x2="63" y2="29" />
      <line x1="33" y1="59" x2="37" y2="55" />
      <line x1="67" y1="59" x2="63" y2="55" />
    </g>
    {/* Inner blue eye/circle */}
    <circle cx="50" cy="42" r="8" fill="#0E2748" />
    <circle cx="50" cy="42" r="4" fill="#FFDF00" />
    {/* Arabic text 'بنك القاهرة' */}
    <rect x="16" y="74" width="68" height="18" rx="8" fill="#091A30" />
    <text x="50" y="87" fill="#D4AF37" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="'Cairo', sans-serif">
      بنك القاهرة
    </text>
  </svg>
);

// 11. AlexBank (بنك الإسكندرية - مجموعة انتيزا سان باولو بالأخضر والبرتقالي)
export const AlexBankIcon: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#005B27" />
    {/* Intesa Sanpaolo Orange Arch Swoop */}
    <path
      d="M 22 55 C 22 36 34 22 50 22 C 66 22 78 36 78 55 C 72 42 62 33 50 33 C 38 33 28 42 22 55 Z"
      fill="#E87722"
    />
    <circle cx="50" cy="46" r="6" fill="#FFFFFF" />
    {/* Arabic text 'بنك الإسكندرية' */}
    <rect x="14" y="74" width="72" height="18" rx="8" fill="#003D1A" />
    <text x="50" y="87" fill="#FFFFFF" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="'Cairo', sans-serif">
      بنك الإسكندرية
    </text>
  </svg>
);

// 12. QNB Alahli (بنك QNB الأهلي - العنابي المميز وشعار Q)
export const QnbIcon: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#7E002B" />
    {/* QNB Loop and Ribbon */}
    <circle cx="50" cy="44" r="24" stroke="#FFFFFF" strokeWidth="5" fill="none" />
    <path d="M 52 46 L 72 66" stroke="#D4AF37" strokeWidth="6" strokeLinecap="round" />
    <circle cx="50" cy="44" r="14" fill="#940436" />
    {/* Arabic text 'QNB الأهلي' */}
    <rect x="16" y="74" width="68" height="18" rx="8" fill="#4A0019" />
    <text x="50" y="87" fill="#FFFFFF" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="'Cairo', sans-serif">
      QNB الأهلي
    </text>
  </svg>
);

// 13. Smart Wallet / Other Bank (محفظة كاش ذكية عامة)
export const OtherProviderIcon: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#1E293B" />
    {/* Gold Smart Chip Card */}
    <rect x="25" y="24" width="50" height="38" rx="7" fill="#334155" stroke="#475569" strokeWidth="2" />
    <rect x="33" y="34" width="15" height="13" rx="3" fill="#D4AF37" />
    <path d="M 40 34 V 47 M 33 40 H 48" stroke="#997A15" strokeWidth="1.5" />
    {/* Contactless waves */}
    <path d="M 60 32 C 64 35 66 38 66 43 S 64 51 60 54" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M 55 36 C 58 38 59 40 59 43 S 58 48 55 50" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
    <rect x="18" y="72" width="64" height="18" rx="8" fill="#0F172A" />
    <text x="50" y="85" fill="#94A3B8" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="'Cairo', sans-serif">
      محفظة كاش
    </text>
  </svg>
);

export interface ProviderConfig {
  name: string;
  shortName: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  accentColor: string;
  icon: React.FC<{ className?: string }>;
}

export const PROVIDER_CONFIG: Record<ProviderType, ProviderConfig> = {
  vodafone: {
    name: 'فودافون كاش',
    shortName: 'فودافون',
    bgColor: 'bg-red-950/70',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/50',
    accentColor: '#E60000',
    icon: VodafoneCashIcon,
  },
  vodafone_vip: {
    name: 'فودافون VIP — Vodafone VIP',
    shortName: 'فودافون VIP',
    bgColor: 'bg-gradient-to-r from-red-950/90 to-amber-950/80',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/60',
    accentColor: '#E60000',
    icon: VodafoneVipIcon,
  },
  orange: {
    name: 'أورنج كاش',
    shortName: 'أورنج',
    bgColor: 'bg-orange-950/70',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500/50',
    accentColor: '#FF6600',
    icon: OrangeCashIcon,
  },
  etisalat: {
    name: 'اتصالات كاش',
    shortName: 'اتصالات',
    bgColor: 'bg-zinc-950',
    textColor: 'text-lime-400',
    borderColor: 'border-zinc-700',
    accentColor: '#7BC143',
    icon: EtisalatCashIcon,
  },
  we: {
    name: 'وي كاش (WE Pay)',
    shortName: 'وي باي',
    bgColor: 'bg-purple-950/70',
    textColor: 'text-purple-300',
    borderColor: 'border-purple-500/50',
    accentColor: '#6A227D',
    icon: WePayIcon,
  },
  instapay: {
    name: 'إنستاباي (InstaPay IPN)',
    shortName: 'إنستاباي',
    bgColor: 'bg-violet-950/70',
    textColor: 'text-violet-300',
    borderColor: 'border-violet-500/50',
    accentColor: '#431868',
    icon: InstaPayIcon,
  },
  banque_misr: {
    name: 'بنك مصر',
    shortName: 'بنك مصر',
    bgColor: 'bg-rose-950/70',
    textColor: 'text-rose-300',
    borderColor: 'border-rose-500/50',
    accentColor: '#8B1D2C',
    icon: BanqueMisrIcon,
  },
  cib: {
    name: 'البنك التجاري الدولي (CIB)',
    shortName: 'CIB',
    bgColor: 'bg-sky-950/70',
    textColor: 'text-sky-300',
    borderColor: 'border-sky-500/50',
    accentColor: '#0A2540',
    icon: CibIcon,
  },
  nbe: {
    name: 'البنك الأهلي المصري (NBE)',
    shortName: 'الأهلي المصري',
    bgColor: 'bg-green-950/70',
    textColor: 'text-green-300',
    borderColor: 'border-green-500/50',
    accentColor: '#006338',
    icon: NbeIcon,
  },
  fawry: {
    name: 'شبكة فوري للمدفوعات',
    shortName: 'فوري',
    bgColor: 'bg-amber-950/70',
    textColor: 'text-amber-300',
    borderColor: 'border-amber-500/50',
    accentColor: '#FFCC00',
    icon: FawryIcon,
  },
  banque_du_caire: {
    name: 'بنك القاهرة',
    shortName: 'بنك القاهرة',
    bgColor: 'bg-blue-950/70',
    textColor: 'text-blue-300',
    borderColor: 'border-blue-500/50',
    accentColor: '#0E2748',
    icon: BanqueDuCaireIcon,
  },
  alexbank: {
    name: 'بنك الإسكندرية',
    shortName: 'الإسكندرية',
    bgColor: 'bg-emerald-950/70',
    textColor: 'text-emerald-300',
    borderColor: 'border-emerald-500/50',
    accentColor: '#005B27',
    icon: AlexBankIcon,
  },
  qnb: {
    name: 'QNB الأهلي',
    shortName: 'QNB',
    bgColor: 'bg-red-950/70',
    textColor: 'text-red-300',
    borderColor: 'border-red-500/50',
    accentColor: '#7E002B',
    icon: QnbIcon,
  },
  other: {
    name: 'خدمة نقدية / بنك آخر',
    shortName: 'أخرى',
    bgColor: 'bg-slate-800',
    textColor: 'text-slate-300',
    borderColor: 'border-slate-700',
    accentColor: '#64748B',
    icon: OtherProviderIcon,
  },
};

export const ProviderBadge: React.FC<ProviderBadgeProps> = ({
  provider,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  const config = PROVIDER_CONFIG[provider] || PROVIDER_CONFIG.other;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div 
        className={`${sizeClasses[size]} rounded-2xl shrink-0 flex items-center justify-center p-0.5 shadow-md border ${config.borderColor} transition-transform hover:scale-105 overflow-hidden bg-slate-900`}
        title={config.name}
      >
        <Icon className="w-full h-full object-contain" />
      </div>
      {showLabel && (
        <span className="font-bold text-slate-100 text-xs sm:text-sm leading-normal">
          {config.name}
        </span>
      )}
    </div>
  );
};
