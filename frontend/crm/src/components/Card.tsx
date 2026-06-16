import React from 'react';
import { cn } from '../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'glow';
}

export const Card: React.FC<CardProps> = ({
  className,
  variant = 'default',
  children,
  ...props
}) => {
  const baseStyle = "rounded-2xl border transition-all duration-300 shadow-md";
  const styles = {
    default: "bg-zinc-900/40 border-zinc-900 light:bg-zinc-50 light:border-zinc-200 text-zinc-100 light:text-zinc-900",
    glass: "glass-panel bg-zinc-950/40 border-zinc-900 text-zinc-100",
    glow: "glass-panel glass-card-glow bg-zinc-950/40 border-zinc-900 text-zinc-100"
  };

  return (
    <div 
      className={cn(baseStyle, styles[variant], className)} 
      {...props}
    >
      {children}
    </div>
  );
};
