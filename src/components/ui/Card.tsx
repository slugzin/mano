import React, { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({ 
  children, 
  variant = 'default', 
  padding = 'md',
  className = '', 
  ...props 
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'outlined':
        return 'bg-card border border-border';
      case 'elevated':
        return 'bg-card border border-border shadow-lg';
      default:
        return 'bg-card border border-border shadow-sm';
    }
  };

  const getPaddingClasses = () => {
    switch (padding) {
      case 'none':
        return '';
      case 'sm':
        return 'p-3';
      case 'md':
        return 'p-6';
      case 'lg':
        return 'p-8';
      default:
        return 'p-6';
    }
  };

  return (
    <div
      className={`
        rounded-lg 
        transition-colors 
        ${getVariantClasses()}
        ${getPaddingClasses()}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

// Card sub-components for better composition
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export const CardHeader: React.FC<CardHeaderProps> = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <div
      className={`flex flex-col space-y-1.5 pb-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export const CardTitle: React.FC<CardTitleProps> = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <h3
      className={`text-lg font-semibold leading-none tracking-tight text-card-foreground ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
};

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription: React.FC<CardDescriptionProps> = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <p
      className={`text-sm text-muted-foreground ${className}`}
      {...props}
    >
      {children}
    </p>
  );
};

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CardContent: React.FC<CardContentProps> = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <div className={`pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
};

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const CardFooter: React.FC<CardFooterProps> = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <div
      className={`flex items-center pt-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card; 