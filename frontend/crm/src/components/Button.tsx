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
  const baseStyles = "inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary text-white shadow-sm hover:bg-zinc-800 border border-transparent focus:ring-zinc-500/20",
    secondary: "bg-white hover:bg-zinc-100  text-primary dark:bg-zinc-100/80 dark:hover:bg-zinc-800 dark:border-zinc-850 dark:text-foreground",
    outline: " hover:border-zinc-700 bg-transparent text-foreground hover:text-zinc-100 light:border-zinc-250 light:hover:border-zinc-400 light:text-zinc-750",
    ghost: "bg-transparent hover:bg-zinc-100 text-zinc-550 hover:text-foreground light:hover:bg-zinc-100 light:text-zinc-600 light:hover:text-zinc-850",
    danger: "bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400"
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


