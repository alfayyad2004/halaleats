import { cn } from '@/lib/utils';

export function HalalEatsLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <svg viewBox="0 0 200 60" className="w-full h-auto">
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: 'hsl(var(--accent-foreground))', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        
        {/* Crescent */}
        <path 
          d="M 40 5 A 30 30 0 1 1 40 55 A 25 25 0 1 0 40 5 Z" 
          fill="url(#goldGradient)"
        />

        {/* Text */}
        <text 
          x="75" 
          y="42" 
          fontFamily="'PT Sans', sans-serif" 
          fontSize="32" 
          fontWeight="bold" 
          fill="hsl(var(--primary))"
        >
          HalalEats
        </text>
      </svg>
    </div>
  );
}
