import React, { useEffect, useRef, useCallback } from 'react';
import './ModalBase.css';

export interface ModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  footer?: React.ReactNode;
  className?: string;
}

/**
 * ModalBase - Reusable modal wrapper with focus trap and accessibility
 */
export const ModalBase: React.FC<ModalBaseProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  footer,
  className,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const hasInitializedFocus = useRef(false);

  // Focus trap - get all focusable elements
  const getFocusableElements = useCallback(() => {
    if (!modalRef.current) return [];
    return Array.from(
      modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute('disabled'));
  }, []);

  // Handle keyboard events (using refs to avoid dependency changes)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Close on Escape
      if (e.key === 'Escape' && closeOnEscape) {
        e.preventDefault();
        onClose();
        return;
      }

      // Focus trap on Tab
      if (e.key === 'Tab') {
        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab - move backwards
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab - move forwards
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose, getFocusableElements]);

  // Setup initial focus and restore focus on close (only runs once when modal opens)
  useEffect(() => {
    if (isOpen && !hasInitializedFocus.current) {
      // Store currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus first focusable element in modal (prefer inputs over buttons)
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        // Find the first input/textarea, or fall back to first focusable
        const firstInput = focusableElements.find(
          (el) => el.tagName === 'INPUT' || el.tagName === 'TEXTAREA'
        );
        const elementToFocus = firstInput || focusableElements[0];
        // Small delay to ensure modal is rendered
        setTimeout(() => elementToFocus.focus(), 10);
      }

      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      hasInitializedFocus.current = true;
    }

    if (!isOpen) {
      // Reset for next open
      hasInitializedFocus.current = false;
      document.body.style.overflow = '';

      // Restore focus when modal closes
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }
  }, [isOpen, getFocusableElements]);

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={`modal-content modal-${size} ${className || ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">
            {title}
          </h2>
          {showCloseButton && (
            <button
              className="modal-close-btn"
              onClick={onClose}
              aria-label="Close modal"
              type="button"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M15 5L5 15M5 5l10 10" />
              </svg>
            </button>
          )}
        </div>

        <div className="modal-body">{children}</div>

        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

// Helper components for modal content
export interface ModalSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const ModalSection: React.FC<ModalSectionProps> = ({ title, children, className }) => (
  <div className={`modal-section ${className || ''}`}>
    {title && <h3 className="modal-section-title">{title}</h3>}
    {children}
  </div>
);

export interface ModalFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

export const ModalField: React.FC<ModalFieldProps> = ({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
}) => (
  <div className={`modal-field ${error ? 'modal-field-error' : ''}`}>
    <label htmlFor={htmlFor} className="modal-field-label">
      {label}
      {required && <span className="modal-field-required">*</span>}
    </label>
    {children}
    {hint && !error && <span className="modal-field-hint">{hint}</span>}
    {error && <span className="modal-field-error-text">{error}</span>}
  </div>
);

export interface ModalActionsProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right' | 'space-between';
}

export const ModalActions: React.FC<ModalActionsProps> = ({ children, align = 'right' }) => (
  <div className={`modal-actions modal-actions-${align}`}>{children}</div>
);

// Button variants for modals
export interface ModalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
}

export const ModalButton: React.FC<ModalButtonProps> = ({
  children,
  variant = 'secondary',
  loading,
  disabled,
  className,
  ...props
}) => (
  <button
    className={`modal-button modal-button-${variant} ${className || ''}`}
    disabled={disabled || loading}
    {...props}
  >
    {loading && <span className="modal-button-spinner" />}
    {children}
  </button>
);

export default ModalBase;
