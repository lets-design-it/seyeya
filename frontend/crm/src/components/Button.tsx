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
  const baseStyles = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md hover:from-violet-500 hover:to-indigo-500 hover:shadow-[0_0_15px_rgba(99,102,241,0.25)]",
    secondary: "bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 light:bg-zinc-100 light:hover:bg-zinc-200 light:border-zinc-200 light:text-zinc-800",
    outline: "border border-zinc-850 hover:border-zinc-700 bg-transparent text-zinc-300 hover:text-zinc-100 light:border-zinc-250 light:hover:border-zinc-400 light:text-zinc-750",
    ghost: "bg-transparent hover:bg-zinc-900/50 text-zinc-400 hover:text-zinc-200 light:hover:bg-zinc-100 light:text-zinc-600 light:hover:text-zinc-850",
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
