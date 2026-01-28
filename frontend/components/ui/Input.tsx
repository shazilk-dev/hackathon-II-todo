/**
 * Modern Input component with validation and accessibility
 * Following 2026 UI/UX design standards - Intelligent Minimalism
 */

import React, { useState, useCallback, forwardRef } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  error?: string;
  success?: string;
  hint?: string;
  showValidation?: boolean;
  onChangeValidation?: (value: string) => void;
  isPassword?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      success,
      hint,
      showValidation = false,
      onChangeValidation,
      isPassword = false,
      type = 'text',
      className = '',
      disabled = false,
      required = false,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);

    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setHasInteracted(true);
        onChangeValidation?.(e.target.value);
      },
      [onChangeValidation]
    );

    const showError = hasInteracted && error;
    const showSuccess = hasInteracted && success && !error && showValidation;

    return (
      <div className="w-full">
        {/* Label */}
        <label
          htmlFor={props.id || props.name}
          className="block text-xs font-medium text-content-primary mb-1.5"
        >
          {label}
          {required && <span className="text-state-error ml-0.5">*</span>}
        </label>

        {/* Input Container */}
        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            disabled={disabled}
            required={required}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            aria-invalid={!!showError}
            aria-describedby={
              showError
                ? `${props.id || props.name}-error`
                : hint
                ? `${props.id || props.name}-hint`
                : undefined
            }
            className={`
              w-full h-9 px-3
              text-sm text-content-primary
              bg-surface-base
              border rounded-lg
              transition-all duration-200 ease-out
              placeholder:text-content-tertiary placeholder:text-sm
              disabled:bg-surface-base disabled:text-content-tertiary disabled:cursor-not-allowed
              focus:outline-none
              ${
                showError
                  ? 'border-state-error focus:border-state-error focus:ring-2 focus:ring-state-error/10'
                  : showSuccess
                  ? 'border-state-success focus:border-state-success focus:ring-2 focus:ring-state-success/10'
                  : isFocused
                  ? 'border-border-focus ring-2 ring-action-primary/10'
                  : 'border-border-subtle hover:border-border-default'
              }
              ${isPassword ? 'pr-10' : showValidation ? 'pr-10' : ''}
              ${className}
            `}
            {...props}
          />

          {/* Password Toggle or Validation Icon */}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded
                text-content-tertiary hover:text-content-primary hover:bg-action-ghost-hover
                transition-all duration-150
                focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}

          {!isPassword && showValidation && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              {showError && (
                <AlertCircle className="w-4 h-4 text-state-error" aria-hidden="true" />
              )}
              {showSuccess && (
                <CheckCircle className="w-4 h-4 text-state-success" aria-hidden="true" />
              )}
            </div>
          )}
        </div>

        {/* Hint, Error, or Success Message */}
        {showError && (
          <p
            id={`${props.id || props.name}-error`}
            className="mt-1.5 text-[11px] text-state-error flex items-start gap-1 animate-slide-down"
            role="alert"
          >
            <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </p>
        )}

        {!showError && showSuccess && (
          <p className="mt-1.5 text-[11px] text-state-success flex items-start gap-1 animate-slide-down">
            <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>{success}</span>
          </p>
        )}

        {!showError && !showSuccess && hint && (
          <p
            id={`${props.id || props.name}-hint`}
            className="mt-1.5 text-[11px] text-content-tertiary"
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
