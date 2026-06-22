import React from 'react';
import { cn } from '../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  className,
  type = 'text',
  label,
  error,
  leftIcon,
  ...props
}, ref) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-550 light:text-zinc-600">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500 pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            "w-full rounded-xl  bg-zinc-50 py-2.5 px-3.5 text-xs text-foreground placeholder-zinc-600 outline-none transition-all focus:border-violet-500 focus:bg-card/60 focus:ring-2 focus:ring-violet-500/10 light:border-zinc-250 light:bg-white light:text-zinc-800 light:placeholder-zinc-400",
            leftIcon && "pl-10",
            error && "border-red-500/50 focus:border-red-500 focus:ring-red-500/10",
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs font-medium text-red-400 mt-0.5">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';


