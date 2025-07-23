import React, { useState, useEffect, useRef } from 'react';
import { X } from '../../utils/icons';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'dark' | 'light';
}

const Modal: React.FC<ModalProps> = React.memo(({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  variant = 'dark'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      setTimeout(() => {
        setIsVisible(false);
        document.body.style.overflow = '';
      }, 200);
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isVisible) return null;

  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'max-w-sm';
      case 'md': return 'max-w-md';
      case 'lg': return 'max-w-lg';
      case 'xl': return 'max-w-xl';
      case '2xl': return 'max-w-2xl';
      default: return 'max-w-md';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'light':
        return 'bg-white border-gray-200';
      case 'dark':
      default:
        return 'bg-gray-900 border-gray-800';
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className={`border rounded-lg shadow-xl w-full ${getSizeClass()} ${getVariantClasses()}
          transform transition-transform duration-300 ${
            isOpen ? 'scale-100' : 'scale-95'
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between p-4 border-b ${
          variant === 'light' ? 'border-gray-200' : 'border-gray-800'
        }`}>
          <h3 className={`text-lg font-semibold ${
            variant === 'light' ? 'text-gray-900' : 'text-white'
          }`}>{title}</h3>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onClose} 
            className={`hover:bg-${variant === 'light' ? 'gray-100' : 'gray-800'} p-1 rounded-full`}
          >
            <X size={20} />
          </Button>
        </div>
        <div className="p-4 max-h-[90vh] overflow-visible flex flex-col items-center justify-center">
          {children}
        </div>
        {footer && (
          <div className={`p-4 border-t ${
            variant === 'light' ? 'border-gray-200' : 'border-gray-800'
          }`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
});

Modal.displayName = 'Modal';

export default Modal;