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
  const baseStyle = "rounded-[24px]  transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.02)]";
  const styles = {
    default: "bg-card text-foreground",
    glass: "glass-panel text-foreground",
    glow: "glass-panel text-foreground"
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


