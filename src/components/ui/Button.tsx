import React, { ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary text-primary-foreground border-none hover:bg-primary/90';
      case 'secondary':
        return 'bg-transparent border border-primary text-primary hover:bg-primary/5';
      case 'outline':
        return 'bg-transparent border border-border text-foreground hover:bg-accent hover:text-accent-foreground';
      case 'ghost':
        return 'bg-transparent hover:bg-accent/10 hover:text-accent-foreground';
      case 'destructive':
        return 'bg-danger text-primary-foreground border-none hover:bg-danger/90';
      default:
        return 'bg-primary text-primary-foreground border-none hover:bg-primary/90';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-8 px-4 text-xs';
      case 'md':
        return 'h-10 px-6 text-sm';
      case 'lg':
        return 'h-12 px-8 text-base';
      default:
        return 'h-10 px-6 text-sm';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <button
        className={`
          inline-flex items-center justify-center 
          rounded-[8px] 
          font-medium 
          transition-colors 
          focus-visible:outline-none 
          focus-visible:ring-2 
          focus-visible:ring-ring 
          focus-visible:ring-offset-2 
          disabled:pointer-events-none 
          disabled:opacity-50
          ${getVariantClasses()}
          ${getSizeClasses()}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="mr-2 h-4 w-4"
          >
            <svg className="h-full w-full" fill="none" viewBox="0 0 24 24">
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </motion.div>
        ) : leftIcon ? (
          <span className="mr-2">{leftIcon}</span>
        ) : null}
        {children}
        {rightIcon && !isLoading && <span className="ml-2">{rightIcon}</span>}
      </button>
    </motion.div>
  );
};

export default Button;