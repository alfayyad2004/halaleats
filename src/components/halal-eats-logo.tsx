'use client';

import { cn } from '@/lib/utils';

export function HalalEatsLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <svg viewBox="0 0 200 60" className="w-full h-auto">
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        
        {/* Stylized Crescent */}
        <path 
          d="M 35 2 C 55 5, 70 25, 60 55 C 55 50, 40 40, 35 20 C 32 10, 33 5, 35 2 Z" 
          fill="url(#logoGradient)"
        />

        {/* Text */}
        <text 
          x="70" 
          y="42" 
          fontFamily="'PT Sans', sans-serif" 
          fontSize="36" 
          fontWeight="bold" 
          fill="hsl(var(--foreground))"
          letterSpacing="-1"
        >
          HalalEats
        </text>
      </svg>
    </div>
  );
}
