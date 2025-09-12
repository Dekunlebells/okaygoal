import React from 'react';
import { clsx } from 'clsx';
import { Competition } from '@/types';

interface CompetitionBadgeProps {
  competition: Competition;
  size?: 'xs' | 'sm' | 'md';
  showCountry?: boolean;
  className?: string;
  onClick?: () => void;
}

export const CompetitionBadge: React.FC<CompetitionBadgeProps> = ({
  competition,
  size = 'sm',
  showCountry = false,
  className,
  onClick,
}) => {
  const sizeClasses = {
    xs: {
      logo: 'w-3 h-3',
      text: 'text-xs',
      spacing: 'gap-1',
      padding: 'px-1.5 py-0.5',
    },
    sm: {
      logo: 'w-4 h-4',
      text: 'text-xs',
      spacing: 'gap-1.5',
      padding: 'px-2 py-1',
    },
    md: {
      logo: 'w-5 h-5',
      text: 'text-sm',
      spacing: 'gap-2',
      padding: 'px-2.5 py-1.5',
    },
  };

  const currentSize = sizeClasses[size];

  const baseClasses = [
    'inline-flex items-center rounded-md bg-gray-100 dark:bg-gray-800',
    currentSize.spacing,
    currentSize.padding,
    currentSize.text,
  ];

  const containerClasses = clsx(
    baseClasses,
    {
      'hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer transition-colors': onClick,
    },
    className
  );

  const displayText = showCountry && competition.country 
    ? `${competition.name} (${competition.country})`
    : competition.name;

  return (
    <div className={containerClasses} onClick={onClick}>
      {competition.logo_url && (
        <img
          src={competition.logo_url}
          alt={`${competition.name} logo`}
          className={clsx(
            currentSize.logo,
            'object-contain'
          )}
          loading="lazy"
        />
      )}
      
      <span className="font-medium text-gray-700 dark:text-gray-300 truncate">
        {displayText}
      </span>
    </div>
  );
};