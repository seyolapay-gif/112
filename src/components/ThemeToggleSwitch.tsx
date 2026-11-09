import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleSwitchProps {
  className?: string;
  compact?: boolean;
}

export const ThemeToggleSwitch: React.FC<ThemeToggleSwitchProps> = ({ 
  className = '',
}) => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-[20px] sm:rounded-[22px] bg-[#e8edf5] hover:bg-[#dfe6ef] border border-[#cbd5e1] shadow-sm flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 group focus:outline-none focus:ring-2 focus:ring-amber-500/40 shrink-0 ${className}`}
      title={isDark ? 'الوضع المظلم مفعل: انقر للتبديل إلى الوضع الفاتح' : 'الوضع الفاتح مفعل: انقر للتبديل إلى الوضع المظلم'}
      aria-label="تبديل مظهر النظام"
    >
      {/* Bright orange sun icon exactly as in the user's mockup images */}
      <svg 
        className="w-6 h-6 text-[#f59e0b] group-hover:rotate-45 transition-transform duration-300 select-none" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="4.2" />
        <line x1="12" y1="2" x2="12" y2="4.5" />
        <line x1="12" y1="19.5" x2="12" y2="22" />
        <line x1="4.5" y1="4.5" x2="6.3" y2="6.3" />
        <line x1="17.7" y1="17.7" x2="19.5" y2="19.5" />
        <line x1="2" y1="12" x2="4.5" y2="12" />
        <line x1="19.5" y1="12" x2="22" y2="12" />
        <line x1="4.5" y1="19.5" x2="6.3" y2="17.7" />
        <line x1="17.7" y1="6.3" x2="19.5" y2="4.5" />
      </svg>
    </button>
  );
};
