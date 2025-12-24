import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGradient" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    {/* Shield Base */}
    <path 
        d="M50 5 L90 25 V55 C90 75 50 95 50 95 C50 95 10 75 10 55 V25 L50 5 Z" 
        className="fill-slate-900 stroke-emerald-500" 
        strokeWidth="3" 
    />
    
    {/* Inner Abstract Football/Gem Pattern */}
    <path 
        d="M50 25 L72 38 V63 L50 75 L28 63 V38 L50 25 Z" 
        fill="url(#logoGradient)" 
        opacity="0.2"
    />
    
    <path 
        d="M50 25 L72 38 M72 38 V63 M72 63 L50 75 M50 75 L28 63 M28 63 V38 M28 38 L50 25" 
        className="stroke-emerald-400" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
    />
    
    {/* Center Lines */}
    <path d="M50 25 V50" className="stroke-emerald-400" strokeWidth="2" />
    <path d="M50 50 L72 63" className="stroke-emerald-400" strokeWidth="2" />
    <path d="M50 50 L28 63" className="stroke-emerald-400" strokeWidth="2" />
    
    {/* Initials */}
    <text x="50" y="55" textAnchor="middle" fill="#ecfdf5" fontSize="20" fontFamily="sans-serif" fontWeight="900" style={{ transformBox: 'fill-box', transformOrigin: 'center', transform: 'translateY(25px)' }}>UFD</text>
  </svg>
);