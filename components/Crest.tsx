
import React from 'react';
import { Team } from '../types';

interface Props {
  team: Team;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Crest: React.FC<Props> = ({ team, size = 'md', className = '' }) => {
  const sizeClasses = { 
    sm: 'w-8 h-10', 
    md: 'w-12 h-14', 
    lg: 'w-20 h-24', 
    xl: 'w-32 h-40' 
  };

  // Fallback for teams created before update
  const crest = team.crest || { 
      shape: 'shield', 
      pattern: 'solid', 
      icon: 'none', 
      color1: team.colors[0], 
      color2: team.colors[1] 
  };

  const primary = crest.color1 || team.colors[0];
  const secondary = crest.color2 || team.colors[1];
  const accent = primary === '#FFFFFF' ? '#000000' : '#FFFFFF';

  const renderShape = () => {
    switch (crest.shape) {
        case 'shield': // Classic Shield
            return <path d="M50 5 L90 25 L90 60 Q50 100 10 60 L10 25 L50 5 Z" fill={primary} stroke={secondary} strokeWidth="3" />;
        case 'round': // Circle
            return <circle cx="50" cy="50" r="45" fill={primary} stroke={secondary} strokeWidth="3" />;
        case 'crest': // Baroque Shield
            return <path d="M50 0 L95 20 L95 85 L50 100 L5 85 L5 20 Z" fill={primary} stroke={secondary} strokeWidth="3" />;
        case 'diamond': // Rotated Square
            return <path d="M50 5 L95 50 L50 95 L5 50 Z" fill={primary} stroke={secondary} strokeWidth="3" />;
        case 'hexagon':
             return <path d="M50 0 L95 25 L95 75 L50 100 L5 75 L5 25 Z" fill={primary} stroke={secondary} strokeWidth="3" />;
        case 'star':
             return <path d="M50 5 L63 35 L95 35 L70 55 L80 85 L50 70 L20 85 L30 55 L5 35 L37 35 Z" fill={primary} stroke={secondary} strokeWidth="3" />;
        default: return <circle cx="50" cy="50" r="45" fill={primary} stroke={secondary} strokeWidth="3" />;
    }
  };

  const renderPattern = () => {
      const clipId = `crestClip-${team.id}`;
      return (
          <g clipPath={`url(#${clipId})`}>
              {crest.pattern === 'stripes' && (
                 <g>
                    <rect x="15" y="0" width="10" height="100" fill={secondary} opacity="0.8" />
                    <rect x="35" y="0" width="10" height="100" fill={secondary} opacity="0.8" />
                    <rect x="55" y="0" width="10" height="100" fill={secondary} opacity="0.8" />
                    <rect x="75" y="0" width="10" height="100" fill={secondary} opacity="0.8" />
                 </g>
              )}
              {crest.pattern === 'hoops' && (
                 <g>
                    <rect x="0" y="20" width="100" height="15" fill={secondary} opacity="0.8" />
                    <rect x="0" y="50" width="100" height="15" fill={secondary} opacity="0.8" />
                    <rect x="0" y="80" width="100" height="15" fill={secondary} opacity="0.8" />
                 </g>
              )}
              {crest.pattern === 'half' && (
                 <rect x="50" y="0" width="50" height="100" fill={secondary} />
              )}
              {crest.pattern === 'quarters' && (
                 <g>
                    <rect x="50" y="0" width="50" height="50" fill={secondary} />
                    <rect x="0" y="50" width="50" height="50" fill={secondary} />
                 </g>
              )}
              {crest.pattern === 'cross' && (
                 <g>
                    <rect x="40" y="0" width="20" height="100" fill={secondary} />
                    <rect x="0" y="40" width="100" height="20" fill={secondary} />
                 </g>
              )}
              {crest.pattern === 'sash' && (
                 <path d="M0 0 L20 0 L100 80 L100 100 L80 100 L0 20 Z" fill={secondary} />
              )}
              {crest.pattern === 'checkered' && (
                 <g fill={secondary} opacity="0.5">
                    <rect x="0" y="0" width="25" height="25" />
                    <rect x="50" y="0" width="25" height="25" />
                    <rect x="25" y="25" width="25" height="25" />
                    <rect x="75" y="25" width="25" height="25" />
                    <rect x="0" y="50" width="25" height="25" />
                    <rect x="50" y="50" width="25" height="25" />
                    <rect x="25" y="75" width="25" height="25" />
                    <rect x="75" y="75" width="25" height="25" />
                 </g>
              )}
          </g>
      );
  };

  const renderIcon = () => {
      const color = accent;
      switch (crest.icon) {
          case 'crown': 
              return <path d="M20 35 L35 50 L50 25 L65 50 L80 35 L80 60 L20 60 Z" fill={color} />;
          case 'ball':
              return <circle cx="50" cy="50" r="15" fill="none" stroke={color} strokeWidth="3" />;
          case 'star':
              return <path d="M50 25 L58 40 L75 40 L61 50 L66 65 L50 55 L34 65 L39 50 L25 40 L42 40 Z" fill={color} />;
          case 'tower':
              return <path d="M35 80 L35 30 L45 20 L55 20 L65 30 L65 80 Z" fill={color} />;
          case 'shield':
              return <path d="M40 35 L60 35 L60 60 Q50 70 40 60 Z" fill={color} />;
          case 'sword':
              return <path d="M48 20 L52 20 L52 70 L60 70 L60 75 L52 75 L52 85 L48 85 L48 75 L40 75 L40 70 L48 70 Z" fill={color} />;
          case 'anchor':
               return <path d="M50 20 L50 70 M35 60 Q50 85 65 60" stroke={color} strokeWidth="4" fill="none" />;
          case 'eagle':
               return <path d="M20 40 Q50 20 80 40 L70 70 L50 60 L30 70 Z" fill={color} />;
          case 'lion':
               return <path d="M30 30 Q50 10 70 30 L70 60 Q50 80 30 60 Z" fill={color} />;
          case 'wings':
               return <path d="M10 40 Q50 60 90 40 L80 50 Q50 70 20 50 Z" fill={color} />;
          case 'tree':
               return <path d="M50 10 L80 70 L60 70 L60 90 L40 90 L40 70 L20 70 Z" fill={color} />;
          case 'horse':
               return <path d="M30 40 Q30 20 50 20 Q70 20 70 40 L70 60 Q70 70 50 70 L50 80 L30 80 L30 60 Q30 50 40 50 Q30 50 30 40" fill={color} />;
          case 'bat':
               return <path d="M20 40 Q50 60 80 40 Q60 80 50 70 Q40 80 20 40 Z" fill={color} />;
          case 'bird':
               return <path d="M10 40 Q30 20 50 40 Q80 20 90 30 Q70 50 50 45 Q30 60 10 40 Z" fill={color} />;
          case 'cross':
               return <path d="M42 20 L58 20 L58 42 L80 42 L80 58 L58 58 L58 80 L42 80 L42 58 L20 58 L20 42 L42 42 Z" fill={color} />;
          case 'wolf':
               return <path d="M25 30 L40 60 L50 50 L60 60 L75 30 L65 70 L35 70 Z" fill={color} />;
          case 'lily':
               return <path d="M50 20 C65 20 65 45 50 60 C35 45 35 20 50 20 M30 45 C20 45 20 65 45 65 L45 75 L55 75 L55 65 C80 65 80 45 70 45" fill={color} />;
          case 'bull':
               return <path d="M20 30 Q30 50 50 50 Q70 50 80 30 L70 60 L50 80 L30 60 Z" fill={color} />;
          case 'bear':
               return <path d="M30 30 Q50 20 70 30 L70 60 Q70 80 50 80 Q30 80 30 60 Z" fill={color} />;
          case 'skull':
               return <path d="M35 30 Q50 15 65 30 V50 Q65 65 50 65 Q35 65 35 50 Z M40 45 A5 5 0 0 1 50 45 A5 5 0 0 1 60 45" fill={color} />;
          case 'dog':
               return <path d="M30 40 L40 20 L60 20 L70 40 L70 60 Q50 80 30 60 Z" fill={color} />;
          case 'ship':
               return <path d="M20 50 L80 50 L70 80 L30 80 Z M50 50 L50 20 L70 40 Z" fill={color} />;
          case 'dragon':
               return <path d="M30 70 Q20 40 40 30 Q60 20 70 40 Q80 60 60 70 Q50 80 30 70 Z" fill={color} />;
          case 'tiger':
               return <path d="M30 30 Q50 10 70 30 L70 60 Q50 80 30 60 Z" fill={color} />;
          case 'moose':
               return <path d="M20 30 Q30 50 50 50 Q70 50 80 30 L70 60 L50 80 L30 60 Z" fill={color} />;
          case 'rose':
               return <path d="M50 30 Q65 20 80 30 Q70 50 50 50 Q30 50 20 30 Q35 20 50 30 M50 50 L50 80 M50 60 L70 50 M50 70 L30 60" stroke={color} strokeWidth="3" fill="none" />;
          case 'owl':
               return <path d="M30 35 Q50 15 70 35 L60 65 L40 65 Z" fill={color} />;
          case 'lamb':
               return <path d="M30 40 Q30 20 50 20 Q70 20 70 40 L70 60 L50 70 L30 60 Z" fill={color} />;
          case 'animal':
               return <path d="M30 40 L40 20 L60 20 L70 40 L60 70 L40 70 Z" fill={color} />;
          case 'fish':
               return <path d="M20 50 Q40 30 60 50 Q80 50 90 30 L90 70 Q80 50 60 50 Q40 70 20 50 Z" fill={color} />;
          case 'lady':
               return <circle cx="50" cy="40" r="15" fill={color} />;
          case 'castle':
               return <path d="M30 70 L30 40 L40 40 L40 30 L60 30 L60 40 L70 40 L70 70 Z" fill={color} />;
          case 'ladder':
               return <path d="M40 20 L40 80 M60 20 L60 80 M40 30 L60 30 M40 50 L60 50 M40 70 L60 70" stroke={color} strokeWidth="4" fill="none"/>;
          case 'church':
               return <path d="M30 70 L30 40 L50 20 L70 40 L70 70 Z" fill={color} />;
          case 'arm':
               return <path d="M30 60 L70 40 L70 50 L30 70 Z" fill={color} />;
          case 'sailor':
               return <circle cx="50" cy="40" r="12" fill={color} />;
          case 'fort':
               return <rect x="30" y="40" width="40" height="30" fill={color} />;
          case 'cock':
               return <path d="M40 60 L50 30 L60 60 L50 50 Z" fill={color} />;
          case 'seahorse':
               return <path d="M45 30 Q55 30 55 40 Q55 50 45 50 Q35 50 45 70" stroke={color} strokeWidth="3" fill="none" />;
          case 'wasp':
               return <ellipse cx="50" cy="50" rx="15" ry="25" fill={color} />;
          case 'wheel':
               return <circle cx="50" cy="50" r="20" stroke={color} strokeWidth="5" fill="none" />;
          case 'leaf':
               return <path d="M50 20 Q70 40 50 80 Q30 40 50 20" fill={color} />;
          case 'hammer':
               return <path d="M40 40 L60 40 L60 60 L40 60 Z M45 60 L45 80 L55 80 L55 60" fill={color} />;
          default: return null;
      }
  };

  // Generate initials nicely
  const initials = team.name
      .replace('Real', '')
      .replace('Club', '')
      .replace('FC', '')
      .replace('CF', '')
      .replace('UD', '')
      .replace('SD', '')
      .replace('CD', '')
      .trim()
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0,2)
      .toUpperCase();

  return (
    <div className={`${sizeClasses[size]} relative drop-shadow-md filter transition-all ${className}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
                <clipPath id={`crestClip-${team.id}`}>
                    {crest.shape === 'shield' && <path d="M50 5 L90 25 L90 60 Q50 100 10 60 L10 25 L50 5 Z" />}
                    {crest.shape === 'round' && <circle cx="50" cy="50" r="45" />}
                    {crest.shape === 'crest' && <path d="M50 0 L95 20 L95 85 L50 100 L5 85 L5 20 Z" />}
                    {crest.shape === 'diamond' && <path d="M50 5 L95 50 L50 95 L5 50 Z" />}
                    {crest.shape === 'hexagon' && <path d="M50 0 L95 25 L95 75 L50 100 L5 75 L5 25 Z" />}
                    {crest.shape === 'star' && <path d="M50 5 L63 35 L95 35 L70 55 L80 85 L50 70 L20 85 L30 55 L5 35 L37 35 Z" />}
                </clipPath>
                <linearGradient id={`sheen-${team.id}`} x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stopColor="white" stopOpacity="0.3" />
                    <stop offset="50%" stopColor="white" stopOpacity="0" />
                    <stop offset="100%" stopColor="black" stopOpacity="0.2" />
                </linearGradient>
            </defs>
            
            {renderShape()}
            {renderPattern()}
            {renderIcon()}

            {/* Typography if no icon or specific style */}
            {crest.icon === 'none' && (
                <text x="50" y="65" textAnchor="middle" fill={accent} 
                      fontSize="24" fontFamily="serif" fontWeight="bold" 
                      filter="drop-shadow(1px 1px 0px rgba(0,0,0,0.5))">
                    {initials}
                </text>
            )}

            {/* Metallic Sheen Overlay */}
            <rect x="0" y="0" width="100" height="100" fill={`url(#sheen-${team.id})`} clipPath={`url(#crestClip-${team.id})`} />
        </svg>
    </div>
  );
};

export const Kit: React.FC<{ team: Team, className?: string }> = ({ team, className }) => {
    const seed = team.name.length;
    const pattern = seed % 3; // 0: Solid, 1: Stripes, 2: Sash
    const p = team.colors[0];
    const s = team.colors[1];

    return (
        <svg viewBox="0 0 100 100" className={className}>
            {/* Shirt Body */}
            <path d="M20 20 L30 10 L70 10 L80 20 L80 90 L20 90 Z" fill={p} />
            {/* Sleeves */}
            <path d="M20 20 L10 30 L20 40 L20 20" fill={p} />
            <path d="M80 20 L90 30 L80 40 L80 20" fill={p} />

            {/* Pattern */}
            {pattern === 1 && (
                <g>
                    <rect x="45" y="10" width="10" height="80" fill={s} />
                </g>
            )}
            {pattern === 2 && (
                <path d="M20 90 L80 10 L70 10 L20 60 Z" fill={s} />
            )}

            {/* Collar */}
            <path d="M40 10 Q50 20 60 10" stroke={s} strokeWidth="2" fill="none" />
        </svg>
    );
};
