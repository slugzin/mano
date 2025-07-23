import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from '../../utils/icons';
import { useTheme } from '../../context/ThemeContext';

interface ThemeSwitcherProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ 
  className = '', 
  size = 'md' 
}) => {
  const { theme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  return (
    <motion.button
      onClick={toggleTheme}
      className={`
        relative ${sizeClasses[size]} 
        rounded-lg 
        bg-card 
        border border-border 
        hover:bg-accent/10 
        transition-colors 
        duration-200 
        flex items-center justify-center
        focus:outline-none 
        focus:ring-2 
        focus:ring-ring 
        focus:ring-offset-2 
        focus:ring-offset-background
        ${className}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === 'light' ? 0 : 180 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="relative"
      >
        {theme === 'light' ? (
          <Sun size={iconSizes[size]} className="text-foreground" />
        ) : (
          <Moon size={iconSizes[size]} className="text-foreground" />
        )}
      </motion.div>
      
      {/* Subtle glow effect */}
      <motion.div
        className="absolute inset-0 rounded-lg bg-accent/5"
        initial={{ opacity: 0 }}
        animate={{ opacity: theme === 'dark' ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />
    </motion.button>
  );
}; 