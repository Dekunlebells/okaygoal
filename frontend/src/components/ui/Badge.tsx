import React from 'react';
import { clsx } from 'clsx';
import { BaseComponentProps } from '@/types';

interface BadgeProps extends BaseComponentProps {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'default',
  size = 'sm',
  dot = false,
  ...props
}) => {
  const baseClasses = [
    'inline-flex items-center font-medium rounded-full',
  ];

  const variantClasses = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200',
    secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  };

  const sizeClasses = {
    xs: dot ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs',
    sm: dot ? 'px-2 py-1 text-xs' : 'px-2.5 py-0.5 text-sm',
    md: dot ? 'px-2.5 py-1.5 text-sm' : 'px-3 py-1 text-sm',
    lg: dot ? 'px-3 py-2 text-base' : 'px-4 py-1.5 text-base',
  };

  const classes = clsx(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  return (
    <span className={classes} {...props}>
      {dot && (
        <span className="w-1.5 h-1.5 bg-current rounded-full mr-1.5" />
      )}
      {children}
    </span>
  );
};