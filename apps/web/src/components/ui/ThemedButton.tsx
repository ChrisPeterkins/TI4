'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { playSound } from '@/hooks/useSounds';

interface ThemedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  fullWidth?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}

export default function ThemedButton({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  glow = true,
  fullWidth = false,
  className = '',
  type = 'button',
}: ThemedButtonProps) {
  const { theme } = useTheme();

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-8 py-4 text-lg';
      default:
        return 'px-5 py-2.5 text-base';
    }
  };

  const getVariantClasses = () => {
    const baseGlow = glow && !disabled;

    switch (variant) {
      case 'primary':
        if (theme.name === 'cosmic') {
          return `
            bg-gradient-to-r from-purple-600 to-indigo-600
            hover:from-purple-500 hover:to-indigo-500
            text-white
            border border-purple-400/30
            ${baseGlow ? 'shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]' : ''}
          `;
        } else if (theme.name === 'imperial') {
          return `
            bg-gradient-to-r from-amber-600 to-amber-700
            hover:from-amber-500 hover:to-amber-600
            text-amber-50
            border border-amber-400/40
            ${baseGlow ? 'shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)]' : ''}
          `;
        } else {
          return `
            bg-gradient-to-r from-cyan-600 to-teal-600
            hover:from-cyan-500 hover:to-teal-500
            text-white
            border border-cyan-400/40
            ${baseGlow ? 'shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)]' : ''}
          `;
        }

      case 'secondary':
        return `
          ${theme.colors.bgPanel}
          hover:bg-white/10
          ${theme.colors.textPrimary}
          border ${theme.colors.border}
          ${baseGlow ? theme.colors.borderGlow : ''}
        `;

      case 'success':
        return `
          bg-gradient-to-r from-emerald-600 to-green-600
          hover:from-emerald-500 hover:to-green-500
          text-white
          border border-emerald-400/30
          ${baseGlow ? 'shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)]' : ''}
        `;

      case 'warning':
        return `
          bg-gradient-to-r from-amber-600 to-orange-600
          hover:from-amber-500 hover:to-orange-500
          text-white
          border border-amber-400/30
          ${baseGlow ? 'shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.6)]' : ''}
        `;

      case 'danger':
        return `
          bg-gradient-to-r from-rose-600 to-red-600
          hover:from-rose-500 hover:to-red-500
          text-white
          border border-rose-400/30
          ${baseGlow ? 'shadow-[0_0_20px_rgba(244,63,94,0.4)] hover:shadow-[0_0_30px_rgba(244,63,94,0.6)]' : ''}
        `;

      case 'ghost':
        return `
          bg-transparent
          hover:bg-white/5
          ${theme.colors.textSecondary}
          hover:${theme.colors.textPrimary}
          border border-transparent
        `;

      default:
        return '';
    }
  };

  const handleClick = () => {
    if (!disabled) {
      playSound('click');
      onClick?.();
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={`
        ${getSizeClasses()}
        ${getVariantClasses()}
        font-semibold
        rounded-lg
        transition-all duration-300
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

interface ThemedIconButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  title?: string;
}

export function ThemedIconButton({
  children,
  onClick,
  disabled = false,
  variant = 'default',
  size = 'md',
  className = '',
  title,
}: ThemedIconButtonProps) {
  const { theme } = useTheme();

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'p-1.5';
      case 'lg':
        return 'p-3';
      default:
        return 'p-2';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return `
          bg-${theme.colors.accent}/20
          hover:bg-${theme.colors.accent}/30
          text-${theme.colors.accent}
          border border-${theme.colors.accent}/30
        `;
      case 'ghost':
        return `
          bg-transparent
          hover:bg-white/5
          ${theme.colors.textMuted}
          hover:${theme.colors.textPrimary}
          border border-transparent
        `;
      default:
        return `
          ${theme.colors.bgPanel}
          ${theme.colors.bgPanelHover}
          ${theme.colors.textSecondary}
          border ${theme.colors.border}
        `;
    }
  };

  const handleClick = () => {
    if (!disabled) {
      playSound('click');
      onClick?.();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      title={title}
      className={`
        ${getSizeClasses()}
        ${getVariantClasses()}
        rounded-lg
        transition-all duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

// ============================================
// NEW HOLOGRAPHIC BUTTON STYLES
// ============================================

type HoloColor = 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple';

interface HoloButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  color?: HoloColor;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}

const colorMap: Record<HoloColor, { base: string; glow: string; rgb: string }> = {
  cyan: { base: 'cyan-400', glow: 'rgba(34,211,238,', rgb: '34,211,238' },
  emerald: { base: 'emerald-400', glow: 'rgba(52,211,153,', rgb: '52,211,153' },
  amber: { base: 'amber-400', glow: 'rgba(251,191,36,', rgb: '251,191,36' },
  rose: { base: 'rose-400', glow: 'rgba(251,113,133,', rgb: '251,113,133' },
  purple: { base: 'purple-400', glow: 'rgba(192,132,252,', rgb: '192,132,252' },
};

const sizeClasses = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

/**
 * HoloBorderButton - Transparent with animated glowing border
 * Great for: Secondary actions, navigation
 */
export function HoloBorderButton({
  children,
  onClick,
  disabled = false,
  color = 'cyan',
  size = 'md',
  fullWidth = false,
  className = '',
  type = 'button',
}: HoloButtonProps) {
  const c = colorMap[color];

  const handleClick = () => {
    if (!disabled) {
      playSound('click');
      onClick?.();
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={`
        group relative
        ${sizeClasses[size]}
        bg-transparent
        font-semibold
        text-${c.base}
        rounded-lg
        overflow-hidden
        transition-all duration-300
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}
        ${className}
      `}
      style={{
        boxShadow: disabled ? 'none' : `0 0 20px ${c.glow}0.2), inset 0 0 20px ${c.glow}0.05)`,
      }}
    >
      {/* Animated border */}
      <span
        className="absolute inset-0 rounded-lg"
        style={{
          background: `linear-gradient(90deg, transparent, ${c.glow}0.8), transparent, ${c.glow}0.8), transparent)`,
          backgroundSize: '200% 100%',
          animation: disabled ? 'none' : 'shimmer 2s infinite linear',
          padding: '1px',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
      {/* Static border fallback */}
      <span className={`absolute inset-0 rounded-lg border border-${c.base}/40`} />
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      {/* Hover glow */}
      <span
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at center, ${c.glow}0.15) 0%, transparent 70%)`,
        }}
      />
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </button>
  );
}

/**
 * HexButton - Hexagonal/angular sci-fi button
 * Great for: Primary actions that need to stand out
 */
export function HexButton({
  children,
  onClick,
  disabled = false,
  color = 'cyan',
  size = 'md',
  fullWidth = false,
  className = '',
  type = 'button',
}: HoloButtonProps) {
  const c = colorMap[color];

  const handleClick = () => {
    if (!disabled) {
      playSound('click');
      onClick?.();
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={`
        group relative
        ${sizeClasses[size]}
        font-bold uppercase tracking-wider
        text-white
        transition-all duration-300
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}
        ${className}
      `}
      style={{
        clipPath: 'polygon(8px 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0 50%)',
        background: disabled
          ? 'linear-gradient(135deg, rgba(100,100,100,0.3), rgba(60,60,60,0.3))'
          : `linear-gradient(135deg, ${c.glow}0.6), ${c.glow}0.3))`,
        boxShadow: disabled ? 'none' : `0 0 30px ${c.glow}0.4)`,
      }}
    >
      {/* Inner highlight */}
      <span
        className="absolute inset-[1px] pointer-events-none"
        style={{
          clipPath: 'polygon(8px 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0 50%)',
          background: `linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 50%)`,
        }}
      />
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      {/* Hover brightening */}
      <span
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          clipPath: 'polygon(8px 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0 50%)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)',
        }}
      />
    </button>
  );
}

/**
 * PulseButton - Button with animated pulsing ring
 * Great for: Attention-grabbing actions like "Rejoin", "Your Turn"
 */
export function PulseButton({
  children,
  onClick,
  disabled = false,
  color = 'cyan',
  size = 'md',
  fullWidth = false,
  className = '',
  type = 'button',
}: HoloButtonProps) {
  const c = colorMap[color];

  const handleClick = () => {
    if (!disabled) {
      playSound('click');
      onClick?.();
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={`
        group relative
        ${sizeClasses[size]}
        font-semibold
        text-white
        rounded-lg
        transition-all duration-300
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}
        ${className}
      `}
      style={{
        background: disabled
          ? 'linear-gradient(135deg, rgba(100,100,100,0.4), rgba(60,60,60,0.4))'
          : `linear-gradient(135deg, ${c.glow}0.5), ${c.glow}0.25))`,
        boxShadow: disabled ? 'none' : `0 0 25px ${c.glow}0.3)`,
      }}
    >
      {/* Pulsing ring */}
      {!disabled && (
        <>
          <span
            className="absolute -inset-1 rounded-lg opacity-60"
            style={{
              border: `2px solid rgb(${c.rgb})`,
              animation: 'pulse-ring 2s ease-out infinite',
            }}
          />
          <span
            className="absolute -inset-1 rounded-lg opacity-40"
            style={{
              border: `2px solid rgb(${c.rgb})`,
              animation: 'pulse-ring 2s ease-out infinite 0.5s',
            }}
          />
        </>
      )}
      {/* Border */}
      <span className={`absolute inset-0 rounded-lg border border-${c.base}/60`} />
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      <style jsx>{`
        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          100% {
            transform: scale(1.15);
            opacity: 0;
          }
        }
      `}</style>
    </button>
  );
}

/**
 * ScanLineButton - Button with scanning line effect
 * Great for: Tech/data-oriented actions
 */
export function ScanLineButton({
  children,
  onClick,
  disabled = false,
  color = 'cyan',
  size = 'md',
  fullWidth = false,
  className = '',
  type = 'button',
}: HoloButtonProps) {
  const c = colorMap[color];

  const handleClick = () => {
    if (!disabled) {
      playSound('click');
      onClick?.();
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={`
        group relative
        ${sizeClasses[size]}
        font-semibold
        text-white
        rounded-lg
        overflow-hidden
        transition-all duration-300
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}
        ${className}
      `}
      style={{
        background: `linear-gradient(180deg, rgba(0,0,0,0.6), rgba(0,0,0,0.8))`,
        boxShadow: disabled ? 'none' : `0 0 20px ${c.glow}0.2), inset 0 1px 0 rgba(255,255,255,0.1)`,
      }}
    >
      {/* Scan line */}
      {!disabled && (
        <span
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(180deg, transparent 0%, ${c.glow}0.3) 50%, transparent 100%)`,
            backgroundSize: '100% 200%',
            animation: 'scan 2s linear infinite',
          }}
        />
      )}
      {/* Grid pattern */}
      <span
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(${c.rgb},0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(${c.rgb},0.3) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />
      {/* Border */}
      <span className={`absolute inset-0 rounded-lg border border-${c.base}/40`} />
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      {/* Hover effect */}
      <span
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `linear-gradient(180deg, ${c.glow}0.1) 0%, transparent 100%)`,
        }}
      />
      <style jsx>{`
        @keyframes scan {
          0% { background-position: 0 200%; }
          100% { background-position: 0 -200%; }
        }
      `}</style>
    </button>
  );
}

/**
 * PowerCoreButton - Glowing energy core effect
 * Great for: Major actions like "Create Lobby", "Start Game", "Launch"
 */
export function PowerCoreButton({
  children,
  onClick,
  disabled = false,
  color = 'cyan',
  size = 'md',
  fullWidth = false,
  className = '',
  type = 'button',
}: HoloButtonProps) {
  const c = colorMap[color];

  const handleClick = () => {
    if (!disabled) {
      playSound('click');
      onClick?.();
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={`
        group relative
        ${sizeClasses[size]}
        font-bold uppercase tracking-wide
        text-white
        rounded-lg
        overflow-hidden
        transition-all duration-300
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}
        ${className}
      `}
      style={{
        background: disabled
          ? 'linear-gradient(180deg, rgba(40,40,40,0.9), rgba(20,20,20,0.9))'
          : 'linear-gradient(180deg, rgba(20,30,40,0.95), rgba(10,15,20,0.95))',
        boxShadow: disabled ? 'none' : `
          0 0 40px ${c.glow}0.3),
          inset 0 0 30px ${c.glow}0.1)
        `,
      }}
    >
      {/* Power core glow (center) */}
      {!disabled && (
        <span
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${c.glow}0.6) 0%, ${c.glow}0.2) 30%, transparent 70%)`,
            animation: 'core-pulse 2s ease-in-out infinite',
          }}
        />
      )}
      {/* Energy lines */}
      {!disabled && (
        <>
          <span
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{
              background: `linear-gradient(90deg, transparent, ${c.glow}0.8), transparent)`,
              animation: 'energy-flow 1.5s ease-in-out infinite',
            }}
          />
          <span
            className="absolute bottom-0 left-0 right-0 h-[2px]"
            style={{
              background: `linear-gradient(90deg, transparent, ${c.glow}0.8), transparent)`,
              animation: 'energy-flow 1.5s ease-in-out infinite 0.75s',
            }}
          />
        </>
      )}
      {/* Border with glow */}
      <span
        className="absolute inset-0 rounded-lg"
        style={{
          border: `1px solid rgb(${c.rgb})`,
          opacity: disabled ? 0.3 : 0.6,
        }}
      />
      {/* Corner accents */}
      <span className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-${c.base}`} style={{ borderRadius: '4px 0 0 0' }} />
      <span className={`absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-${c.base}`} style={{ borderRadius: '0 4px 0 0' }} />
      <span className={`absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-${c.base}`} style={{ borderRadius: '0 0 0 4px' }} />
      <span className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-${c.base}`} style={{ borderRadius: '0 0 4px 0' }} />
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      {/* Hover flash */}
      <span
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-lg"
        style={{
          background: `linear-gradient(180deg, ${c.glow}0.2) 0%, transparent 50%, ${c.glow}0.1) 100%)`,
        }}
      />
      <style jsx>{`
        @keyframes core-pulse {
          0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
        }
        @keyframes energy-flow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </button>
  );
}

/**
 * GlassButton - Clean frosted glass effect
 * Great for: General purpose, subtle actions
 */
export function GlassButton({
  children,
  onClick,
  disabled = false,
  color = 'cyan',
  size = 'md',
  fullWidth = false,
  className = '',
  type = 'button',
}: HoloButtonProps) {
  const c = colorMap[color];

  const handleClick = () => {
    if (!disabled) {
      playSound('click');
      onClick?.();
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={`
        group relative
        ${sizeClasses[size]}
        font-semibold
        text-white
        rounded-lg
        backdrop-blur-sm
        transition-all duration-300
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}
        ${className}
      `}
      style={{
        background: disabled
          ? 'rgba(60,60,60,0.4)'
          : 'rgba(255,255,255,0.08)',
        boxShadow: disabled ? 'none' : `
          0 4px 24px rgba(0,0,0,0.3),
          inset 0 1px 0 rgba(255,255,255,0.15),
          0 0 15px ${c.glow}0.15)
        `,
      }}
    >
      {/* Top highlight */}
      <span
        className="absolute inset-x-0 top-0 h-[1px]"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
        }}
      />
      {/* Border */}
      <span className={`absolute inset-0 rounded-lg border border-white/10`} />
      {/* Content */}
      <span className={`relative z-10 flex items-center justify-center gap-2 text-${c.base}`}>
        {children}
      </span>
      {/* Hover glow */}
      <span
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${c.glow}0.15), transparent 70%)`,
        }}
      />
    </button>
  );
}

/**
 * WarpButton - Hyperspace/warp drive effect
 * Great for: Navigation, "Go", travel-related actions
 */
export function WarpButton({
  children,
  onClick,
  disabled = false,
  color = 'cyan',
  size = 'md',
  fullWidth = false,
  className = '',
  type = 'button',
}: HoloButtonProps) {
  const c = colorMap[color];

  const handleClick = () => {
    if (!disabled) {
      playSound('click');
      onClick?.();
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={`
        group relative
        ${sizeClasses[size]}
        font-bold uppercase tracking-wider
        text-white
        rounded-lg
        overflow-hidden
        transition-all duration-300
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}
        ${className}
      `}
      style={{
        background: `linear-gradient(90deg, rgba(0,0,0,0.8), rgba(0,0,0,0.6), rgba(0,0,0,0.8))`,
        boxShadow: disabled ? 'none' : `0 0 30px ${c.glow}0.3)`,
      }}
    >
      {/* Warp streaks */}
      {!disabled && (
        <>
          <span
            className="absolute inset-0 opacity-60"
            style={{
              background: `
                linear-gradient(90deg, transparent 0%, ${c.glow}0.4) 20%, transparent 40%),
                linear-gradient(90deg, transparent 60%, ${c.glow}0.3) 80%, transparent 100%)
              `,
              animation: 'warp-streak 0.8s linear infinite',
            }}
          />
          <span
            className="absolute inset-0 opacity-40"
            style={{
              background: `linear-gradient(90deg, transparent, ${c.glow}0.6), transparent)`,
              animation: 'warp-streak 0.6s linear infinite 0.2s',
            }}
          />
        </>
      )}
      {/* Center glow */}
      <span
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${c.glow}0.2) 0%, transparent 60%)`,
        }}
      />
      {/* Border */}
      <span
        className="absolute inset-0 rounded-lg"
        style={{ border: `1px solid rgb(${c.rgb})`, opacity: 0.5 }}
      />
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      <style jsx>{`
        @keyframes warp-streak {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </button>
  );
}

/**
 * ShieldButton - Energy shield with hexagonal pattern
 * Great for: Defensive actions, protection, security
 */
export function ShieldButton({
  children,
  onClick,
  disabled = false,
  color = 'cyan',
  size = 'md',
  fullWidth = false,
  className = '',
  type = 'button',
}: HoloButtonProps) {
  const c = colorMap[color];

  const handleClick = () => {
    if (!disabled) {
      playSound('click');
      onClick?.();
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={`
        group relative
        ${sizeClasses[size]}
        font-semibold
        text-white
        rounded-lg
        overflow-hidden
        transition-all duration-300
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}
        ${className}
      `}
      style={{
        background: `linear-gradient(180deg, ${c.glow}0.15), ${c.glow}0.05))`,
        boxShadow: disabled ? 'none' : `
          0 0 20px ${c.glow}0.3),
          inset 0 0 20px ${c.glow}0.1)
        `,
      }}
    >
      {/* Hex pattern overlay */}
      <span
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='28' height='49' viewBox='0 0 28 49' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9z' fill='rgb(${c.rgb})' fill-opacity='0.5'/%3E%3C/svg%3E")`,
        }}
      />
      {/* Shield pulse on hover */}
      {!disabled && (
        <span
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(ellipse at center, ${c.glow}0.3) 0%, transparent 70%)`,
            animation: 'shield-pulse 1.5s ease-in-out infinite',
          }}
        />
      )}
      {/* Outer glow ring */}
      <span
        className="absolute -inset-[2px] rounded-lg opacity-50 group-hover:opacity-80 transition-opacity"
        style={{
          background: `linear-gradient(180deg, ${c.glow}0.4), transparent, ${c.glow}0.2))`,
          padding: '1px',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      <style jsx>{`
        @keyframes shield-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </button>
  );
}

/**
 * CommandButton - Military tactical style with chevrons
 * Great for: Important commands, tactical decisions
 */
export function CommandButton({
  children,
  onClick,
  disabled = false,
  color = 'cyan',
  size = 'md',
  fullWidth = false,
  className = '',
  type = 'button',
}: HoloButtonProps) {
  const c = colorMap[color];

  const handleClick = () => {
    if (!disabled) {
      playSound('click');
      onClick?.();
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={`
        group relative
        ${sizeClasses[size]}
        font-bold uppercase tracking-widest
        text-white
        overflow-hidden
        transition-all duration-300
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}
        ${className}
      `}
      style={{
        background: 'linear-gradient(180deg, rgba(30,40,50,0.95), rgba(15,20,25,0.95))',
        clipPath: 'polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)',
        boxShadow: disabled ? 'none' : `0 0 25px ${c.glow}0.2)`,
      }}
    >
      {/* Top accent line */}
      <span
        className="absolute top-0 left-[12px] right-[12px] h-[2px]"
        style={{ background: `rgb(${c.rgb})`, opacity: 0.8 }}
      />
      {/* Bottom accent line */}
      <span
        className="absolute bottom-0 left-[12px] right-[12px] h-[2px]"
        style={{ background: `rgb(${c.rgb})`, opacity: 0.5 }}
      />
      {/* Left chevron */}
      <span
        className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-4"
        style={{
          background: `linear-gradient(180deg, transparent, rgb(${c.rgb}), transparent)`,
          opacity: 0.6,
        }}
      />
      {/* Right chevron */}
      <span
        className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-4"
        style={{
          background: `linear-gradient(180deg, transparent, rgb(${c.rgb}), transparent)`,
          opacity: 0.6,
        }}
      />
      {/* Status indicator */}
      {!disabled && (
        <span
          className="absolute top-2 right-3 w-2 h-2 rounded-full"
          style={{
            background: `rgb(${c.rgb})`,
            boxShadow: `0 0 8px rgb(${c.rgb})`,
            animation: 'status-blink 2s ease-in-out infinite',
          }}
        />
      )}
      {/* Hover effect */}
      <span
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `linear-gradient(180deg, ${c.glow}0.1) 0%, transparent 50%)`,
        }}
      />
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      <style jsx>{`
        @keyframes status-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </button>
  );
}

/**
 * PlasmaButton - Swirling plasma energy effect
 * Great for: Power-related actions, energy, activation
 */
export function PlasmaButton({
  children,
  onClick,
  disabled = false,
  color = 'cyan',
  size = 'md',
  fullWidth = false,
  className = '',
  type = 'button',
}: HoloButtonProps) {
  const c = colorMap[color];

  const handleClick = () => {
    if (!disabled) {
      playSound('click');
      onClick?.();
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={`
        group relative
        ${sizeClasses[size]}
        font-semibold
        text-white
        rounded-full
        overflow-hidden
        transition-all duration-300
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}
        ${className}
      `}
      style={{
        background: `radial-gradient(ellipse at 30% 30%, ${c.glow}0.4), ${c.glow}0.1) 50%, rgba(0,0,0,0.8) 100%)`,
        boxShadow: disabled ? 'none' : `
          0 0 40px ${c.glow}0.4),
          inset 0 0 20px ${c.glow}0.2)
        `,
      }}
    >
      {/* Plasma swirl */}
      {!disabled && (
        <span
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse at 70% 20%, ${c.glow}0.5) 0%, transparent 50%),
              radial-gradient(ellipse at 30% 80%, ${c.glow}0.3) 0%, transparent 50%)
            `,
            animation: 'plasma-swirl 3s ease-in-out infinite',
          }}
        />
      )}
      {/* Electric arcs */}
      {!disabled && (
        <>
          <span
            className="absolute top-1/4 left-1/4 w-1/2 h-[1px] opacity-60"
            style={{
              background: `linear-gradient(90deg, transparent, rgb(${c.rgb}), transparent)`,
              animation: 'arc-flash 0.5s ease-in-out infinite',
              transformOrigin: 'left center',
            }}
          />
          <span
            className="absolute bottom-1/3 right-1/4 w-1/3 h-[1px] opacity-40"
            style={{
              background: `linear-gradient(90deg, transparent, rgb(${c.rgb}), transparent)`,
              animation: 'arc-flash 0.7s ease-in-out infinite 0.2s',
            }}
          />
        </>
      )}
      {/* Border glow */}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          border: `2px solid rgb(${c.rgb})`,
          opacity: disabled ? 0.3 : 0.6,
        }}
      />
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      <style jsx>{`
        @keyframes plasma-swirl {
          0%, 100% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.1); }
        }
        @keyframes arc-flash {
          0%, 100% { opacity: 0; transform: scaleX(0); }
          50% { opacity: 0.8; transform: scaleX(1); }
        }
      `}</style>
    </button>
  );
}

/**
 * OrbitalButton - Orbiting particles around edge
 * Great for: Loading states, processing, cosmic theme
 */
export function OrbitalButton({
  children,
  onClick,
  disabled = false,
  color = 'cyan',
  size = 'md',
  fullWidth = false,
  className = '',
  type = 'button',
}: HoloButtonProps) {
  const c = colorMap[color];

  const handleClick = () => {
    if (!disabled) {
      playSound('click');
      onClick?.();
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={`
        group relative
        ${sizeClasses[size]}
        font-semibold
        text-white
        rounded-lg
        overflow-visible
        transition-all duration-300
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}
        ${className}
      `}
      style={{
        background: 'linear-gradient(180deg, rgba(20,25,30,0.9), rgba(10,12,15,0.95))',
        boxShadow: disabled ? 'none' : `0 0 20px ${c.glow}0.2)`,
      }}
    >
      {/* Orbital track */}
      <span
        className="absolute -inset-2 rounded-xl pointer-events-none"
        style={{
          border: `1px dashed rgb(${c.rgb})`,
          opacity: 0.2,
        }}
      />
      {/* Orbiting particles */}
      {!disabled && (
        <>
          <span
            className="absolute w-2 h-2 rounded-full pointer-events-none"
            style={{
              background: `rgb(${c.rgb})`,
              boxShadow: `0 0 10px rgb(${c.rgb}), 0 0 20px ${c.glow}0.5)`,
              animation: 'orbit 3s linear infinite',
              top: '-8px',
              left: 'calc(50% - 4px)',
            }}
          />
          <span
            className="absolute w-1.5 h-1.5 rounded-full pointer-events-none"
            style={{
              background: `rgb(${c.rgb})`,
              boxShadow: `0 0 8px rgb(${c.rgb})`,
              animation: 'orbit 3s linear infinite 1s',
              top: '-8px',
              left: 'calc(50% - 3px)',
              opacity: 0.7,
            }}
          />
          <span
            className="absolute w-1 h-1 rounded-full pointer-events-none"
            style={{
              background: `rgb(${c.rgb})`,
              boxShadow: `0 0 6px rgb(${c.rgb})`,
              animation: 'orbit 3s linear infinite 2s',
              top: '-8px',
              left: 'calc(50% - 2px)',
              opacity: 0.5,
            }}
          />
        </>
      )}
      {/* Inner border */}
      <span
        className="absolute inset-0 rounded-lg"
        style={{
          border: `1px solid rgb(${c.rgb})`,
          opacity: 0.4,
        }}
      />
      {/* Content */}
      <span className={`relative z-10 flex items-center justify-center gap-2 text-${c.base}`}>
        {children}
      </span>
      <style jsx>{`
        @keyframes orbit {
          0% {
            transform: rotate(0deg) translateX(calc(50% + 8px)) rotate(0deg);
          }
          100% {
            transform: rotate(360deg) translateX(calc(50% + 8px)) rotate(-360deg);
          }
        }
      `}</style>
    </button>
  );
}

/**
 * DataStreamButton - Flowing data/code visualization
 * Great for: Data operations, downloads, tech actions
 */
export function DataStreamButton({
  children,
  onClick,
  disabled = false,
  color = 'cyan',
  size = 'md',
  fullWidth = false,
  className = '',
  type = 'button',
}: HoloButtonProps) {
  const c = colorMap[color];

  const handleClick = () => {
    if (!disabled) {
      playSound('click');
      onClick?.();
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={`
        group relative
        ${sizeClasses[size]}
        font-mono font-semibold
        text-white
        rounded-lg
        overflow-hidden
        transition-all duration-300
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}
        ${className}
      `}
      style={{
        background: 'linear-gradient(180deg, rgba(0,10,20,0.95), rgba(0,5,10,0.98))',
        boxShadow: disabled ? 'none' : `0 0 20px ${c.glow}0.2), inset 0 0 30px rgba(0,0,0,0.5)`,
      }}
    >
      {/* Data stream background */}
      {!disabled && (
        <span
          className="absolute inset-0 opacity-30 pointer-events-none overflow-hidden font-mono text-[8px] leading-tight"
          style={{
            color: `rgb(${c.rgb})`,
            animation: 'data-scroll 4s linear infinite',
          }}
        >
          {'10110101 00101101 11010010 10101011 01101001 '.repeat(20)}
        </span>
      )}
      {/* Scan line */}
      {!disabled && (
        <span
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(180deg, transparent 0%, ${c.glow}0.15) 50%, transparent 100%)`,
            backgroundSize: '100% 20px',
            animation: 'data-scan 1.5s linear infinite',
          }}
        />
      )}
      {/* Border with data flow indicator */}
      <span
        className="absolute inset-0 rounded-lg"
        style={{ border: `1px solid rgb(${c.rgb})`, opacity: 0.4 }}
      />
      {/* Corner brackets */}
      <span className={`absolute top-1 left-1 text-${c.base} text-xs opacity-60`}>[</span>
      <span className={`absolute top-1 right-1 text-${c.base} text-xs opacity-60`}>]</span>
      <span className={`absolute bottom-1 left-1 text-${c.base} text-xs opacity-60`}>[</span>
      <span className={`absolute bottom-1 right-1 text-${c.base} text-xs opacity-60`}>]</span>
      {/* Content */}
      <span className={`relative z-10 flex items-center justify-center gap-2 text-${c.base}`}>
        {children}
      </span>
      <style jsx>{`
        @keyframes data-scroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes data-scan {
          0% { background-position: 0 -20px; }
          100% { background-position: 0 100%; }
        }
      `}</style>
    </button>
  );
}

/**
 * NexusButton - Central glowing nexus point
 * Great for: Central/important actions, hubs, connections
 */
export function NexusButton({
  children,
  onClick,
  disabled = false,
  color = 'cyan',
  size = 'md',
  fullWidth = false,
  className = '',
  type = 'button',
}: HoloButtonProps) {
  const c = colorMap[color];

  const handleClick = () => {
    if (!disabled) {
      playSound('click');
      onClick?.();
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={`
        group relative
        ${sizeClasses[size]}
        font-semibold
        text-white
        rounded-lg
        overflow-hidden
        transition-all duration-300
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}
        ${className}
      `}
      style={{
        background: 'linear-gradient(180deg, rgba(15,20,30,0.95), rgba(5,10,15,0.98))',
        boxShadow: disabled ? 'none' : `0 0 30px ${c.glow}0.25)`,
      }}
    >
      {/* Nexus core */}
      {!disabled && (
        <span
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full pointer-events-none"
          style={{
            background: `rgb(${c.rgb})`,
            boxShadow: `
              0 0 10px rgb(${c.rgb}),
              0 0 20px ${c.glow}0.6),
              0 0 40px ${c.glow}0.4)
            `,
            animation: 'nexus-pulse 2s ease-in-out infinite',
          }}
        />
      )}
      {/* Radiating lines */}
      {!disabled && (
        <>
          <span
            className="absolute top-1/2 left-1/2 w-full h-[1px] -translate-y-1/2 pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent, ${c.glow}0.4) 30%, ${c.glow}0.4) 70%, transparent)`,
            }}
          />
          <span
            className="absolute top-1/2 left-1/2 w-[1px] h-full -translate-x-1/2 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, transparent, ${c.glow}0.4) 30%, ${c.glow}0.4) 70%, transparent)`,
            }}
          />
          <span
            className="absolute top-1/2 left-1/2 w-[141%] h-[1px] -translate-x-1/2 -translate-y-1/2 rotate-45 pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent, ${c.glow}0.2) 40%, ${c.glow}0.2) 60%, transparent)`,
            }}
          />
          <span
            className="absolute top-1/2 left-1/2 w-[141%] h-[1px] -translate-x-1/2 -translate-y-1/2 -rotate-45 pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent, ${c.glow}0.2) 40%, ${c.glow}0.2) 60%, transparent)`,
            }}
          />
        </>
      )}
      {/* Border */}
      <span
        className="absolute inset-0 rounded-lg"
        style={{ border: `1px solid rgb(${c.rgb})`, opacity: 0.3 }}
      />
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      <style jsx>{`
        @keyframes nexus-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.7; }
        }
      `}</style>
    </button>
  );
}
