import React from 'react';
import { cn } from '../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";
  
  const variants = {
    primary: "bg-[#0A2540] hover:bg-[#07192C] text-[#D4AF37] border border-[#D4AF37]/30 shadow-sm dark:bg-[#D4AF37] dark:text-[#0A192F] dark:hover:bg-[#B89320]",
    secondary: "bg-[#D4AF37] hover:bg-[#B89320] text-[#0A192F] border border-[#D4AF37]/30 dark:bg-[#D4AF37] dark:text-[#0A192F] dark:hover:bg-[#B89320]",
    outline: "border border-[#D4AF37]/40 bg-transparent text-[#0A2540] hover:bg-[#0A2540]/10 dark:text-[#D4AF37] dark:hover:bg-[#162A45] dark:border-[#1E3A5F]",
    ghost: "bg-transparent hover:bg-zinc-100 dark:hover:bg-[#162A45] text-zinc-600 dark:text-zinc-300",
    danger: "bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400",
    gold: "bg-[#D4AF37] hover:bg-[#B89320] text-[#0A192F] dark:bg-[#D4AF37] dark:text-[#0A192F] dark:hover:bg-[#B89320] border border-[#D4AF37]/30 shadow-sm font-bold"
  };

  const sizes = {
    sm: "px-3.5 py-1.5 text-xs",
    md: "px-4.5 py-2.5 text-xs",
    lg: "px-6 py-3.5 text-sm"
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2 shrink-0" />
      ) : null}
      {children}
    </button>
  );
};


