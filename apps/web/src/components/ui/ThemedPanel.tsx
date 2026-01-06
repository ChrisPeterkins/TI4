'use client';

import { useTheme } from '@/contexts/ThemeContext';

interface ThemedPanelProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'highlight' | 'success' | 'warning' | 'error';
  glow?: boolean;
  hover?: boolean;
  onClick?: () => void;
}

export default function ThemedPanel({
  children,
  className = '',
  variant = 'default',
  glow = false,
  hover = false,
  onClick,
}: ThemedPanelProps) {
  const { theme } = useTheme();

  const getVariantStyles = () => {
    const basePanel = theme.colors.bgPanel;
    const hoverPanel = hover ? theme.colors.bgPanelHover : '';

    switch (variant) {
      case 'highlight':
        return {
          bg: basePanel,
          border: theme.colors.border,
          glow: glow ? theme.colors.borderGlow : '',
        };
      case 'success':
        return {
          bg: `${basePanel} bg-emerald-950/20`,
          border: 'border-emerald-500/40',
          glow: glow ? 'shadow-[0_0_15px_rgba(16,185,129,0.3)]' : '',
        };
      case 'warning':
        return {
          bg: `${basePanel} bg-amber-950/20`,
          border: 'border-amber-500/40',
          glow: glow ? 'shadow-[0_0_15px_rgba(245,158,11,0.3)]' : '',
        };
      case 'error':
        return {
          bg: `${basePanel} bg-rose-950/20`,
          border: 'border-rose-500/40',
          glow: glow ? 'shadow-[0_0_15px_rgba(244,63,94,0.3)]' : '',
        };
      default:
        return {
          bg: basePanel,
          border: 'border-white/10',
          glow: glow ? theme.colors.borderGlow : '',
        };
    }
  };

  const styles = getVariantStyles();
  const interactiveClass = onClick ? 'cursor-pointer' : '';
  const hoverClass = hover ? theme.colors.bgPanelHover : '';

  return (
    <div
      className={`
        ${styles.bg}
        ${hoverClass}
        border ${styles.border}
        ${styles.glow}
        rounded-xl
        transition-all duration-300
        ${interactiveClass}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface ThemedCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
  glowColor?: string;
}

export function ThemedCard({
  children,
  className = '',
  title,
  icon,
  glowColor,
}: ThemedCardProps) {
  const { theme } = useTheme();

  const glowStyle = glowColor
    ? { boxShadow: `0 0 20px ${glowColor}` }
    : undefined;

  return (
    <div
      className={`
        ${theme.colors.bgPanel}
        border ${theme.colors.border}
        rounded-xl
        overflow-hidden
        ${className}
      `}
      style={glowStyle}
    >
      {title && (
        <div className={`
          px-4 py-3
          border-b ${theme.colors.border}
          bg-gradient-to-r ${theme.colors.bgSecondary}
          flex items-center gap-2
        `}>
          {icon && <span className={`text-${theme.colors.accent}`}>{icon}</span>}
          <h3 className={`font-semibold ${theme.colors.textPrimary}`}>{title}</h3>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

interface ThemedDividerProps {
  className?: string;
  glow?: boolean;
}

export function ThemedDivider({ className = '', glow = false }: ThemedDividerProps) {
  const { theme } = useTheme();

  return (
    <div
      className={`
        h-px
        bg-gradient-to-r from-transparent via-${theme.colors.accent}/50 to-transparent
        ${glow ? `shadow-[0_0_10px_rgba(168,85,247,0.3)]` : ''}
        ${className}
      `}
    />
  );
}

interface ThemedBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  color?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple';
  pulse?: boolean;
  className?: string;
}

const badgeColorMap: Record<string, string> = {
  cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
  emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  amber: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  rose: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
  purple: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
};

export function ThemedBadge({
  children,
  variant = 'default',
  color,
  pulse = false,
  className = '',
}: ThemedBadgeProps) {
  const { theme } = useTheme();

  const getStyles = () => {
    // If color is specified, use it directly
    if (color) {
      return badgeColorMap[color];
    }

    // Otherwise use variant
    switch (variant) {
      case 'success':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'warning':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'error':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      case 'info':
        return `bg-${theme.colors.info}/20 text-${theme.colors.info} border-${theme.colors.info}/40`;
      default:
        return `bg-${theme.colors.accent}/20 text-${theme.colors.accent} border-${theme.colors.accent}/40`;
    }
  };

  return (
    <span
      className={`
        inline-flex items-center
        px-2.5 py-0.5
        text-xs font-medium
        rounded-full
        border
        ${getStyles()}
        ${pulse ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
