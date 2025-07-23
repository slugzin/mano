import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions, icon }) => {
  return (
    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4 md:mb-8 border-b border-border pb-4 md:pb-6 bg-background">
      <div className="flex items-center gap-2 md:gap-4">
        {icon && (
          <span className="text-primary flex items-center justify-center w-8 h-8 md:w-10 md:h-10">
            {React.cloneElement(icon as React.ReactElement, {
              size: typeof window !== 'undefined' && window.innerWidth < 768 ? 20 : 32,
              className: "text-primary"
            })}
          </span>
        )}
        <div>
          <h1 className="text-base md:text-2xl font-semibold text-foreground leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1 hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2">{actions}</div>
      )}
    </header>
  );
};

export default PageHeader; 