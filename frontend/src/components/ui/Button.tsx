import React from 'react';
import { clsx } from 'clsx';
import { BaseComponentProps } from '@/types';

interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  leftIcon,
  rightIcon,
  ...props
}) => {
  const baseClasses = [
    'inline-flex items-center justify-center font-medium rounded-md',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'transition-colors duration-200',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ];

  const variantClasses = {
    primary: [
      'bg-primary-500 text-white hover:bg-primary-600',
      'focus:ring-primary-500',
      'border border-transparent',
    ],
    secondary: [
      'bg-gray-200 text-gray-900 hover:bg-gray-300',
      'dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
      'focus:ring-gray-500',
      'border border-transparent',
    ],
    outline: [
      'bg-transparent text-gray-700 hover:bg-gray-50',
      'dark:text-gray-300 dark:hover:bg-gray-800',
      'border border-gray-300 dark:border-gray-600',
      'focus:ring-gray-500',
    ],
    danger: [
      'bg-red-500 text-white hover:bg-red-600',
      'focus:ring-red-500',
      'border border-transparent',
    ],
    ghost: [
      'bg-transparent text-gray-600 hover:bg-gray-100',
      'dark:text-gray-400 dark:hover:bg-gray-800',
      'focus:ring-gray-500',
      'border border-transparent',
    ],
  };

  const sizeClasses = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-4 py-2 text-base',
    xl: 'px-6 py-3 text-base',
  };

  const classes = clsx(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
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
      )}
      
      {!loading && leftIcon && (
        <span className="mr-2">{leftIcon}</span>
      )}
      
      {children}
      
      {!loading && rightIcon && (
        <span className="ml-2">{rightIcon}</span>
      )}
    </button>
  );
};