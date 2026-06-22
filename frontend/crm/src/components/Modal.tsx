import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className
}) => {
  // Lock body scroll and listen for escape key when open
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-card/75 backdrop-blur-md animate-fade-in">
      <div 
        className={cn(
          "glass-panel glass-card-glow rounded-3xl w-full max-w-md p-6 shadow-2xl ",
          className
        )}
      >
        <div className="flex items-center justify-between  pb-3 mb-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">{title}</h3>
          <button 
            onClick={onClose}
            className="text-zinc-500 hover:text-foreground rounded-lg p-1 transition-colors focus:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="text-foreground">
          {children}
        </div>
      </div>
    </div>
  );
};


