import React from 'react';
import { clsx } from 'clsx';
import { Team } from '@/types';

interface TeamBadgeProps {
  team: Team;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  showShortName?: boolean;
  variant?: 'default' | 'compact';
  className?: string;
  onClick?: () => void;
}

export const TeamBadge: React.FC<TeamBadgeProps> = ({
  team,
  size = 'md',
  showName = false,
  showShortName = false,
  variant = 'default',
  className,
  onClick,
}) => {
  const sizeClasses = {
    xs: {
      logo: 'w-4 h-4',
      text: 'text-xs',
      spacing: 'gap-1',
      padding: 'p-1',
    },
    sm: {
      logo: 'w-5 h-5',
      text: 'text-xs',
      spacing: 'gap-1.5',
      padding: 'p-1.5',
    },
    md: {
      logo: 'w-6 h-6',
      text: 'text-sm',
      spacing: 'gap-2',
      padding: 'p-2',
    },
    lg: {
      logo: 'w-8 h-8',
      text: 'text-base',
      spacing: 'gap-2.5',
      padding: 'p-2.5',
    },
    xl: {
      logo: 'w-10 h-10',
      text: 'text-lg',
      spacing: 'gap-3',
      padding: 'p-3',
    },
  };

  const currentSize = sizeClasses[size];

  const baseClasses = [
    'inline-flex items-center',
    currentSize.spacing,
  ];

  const containerClasses = clsx(
    baseClasses,
    {
      'hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md cursor-pointer transition-colors': onClick,
      [currentSize.padding]: onClick,
    },
    className
  );

  const displayName = showShortName ? team.short_name || team.name : team.name;

  return (
    <div className={containerClasses} onClick={onClick}>
      {team.logo_url ? (
        <img
          src={team.logo_url}
          alt={`${team.name} logo`}
          className={clsx(
            currentSize.logo,
            'object-contain bg-white rounded-sm'
          )}
          loading="lazy"
          onError={(e) => {
            // Fallback to initials if logo fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
      ) : null}
      
      {/* Fallback to team initials */}
      <div
        className={clsx(
          currentSize.logo,
          'bg-gray-200 dark:bg-gray-700 rounded-sm flex items-center justify-center text-gray-600 dark:text-gray-400 font-semibold',
          currentSize.text,
          { 'hidden': team.logo_url }
        )}
        style={{ display: team.logo_url ? 'none' : 'flex' }}
      >
        {team.name?.substring(0, 2).toUpperCase() || 'FC'}
      </div>

      {(showName || showShortName) && (
        <span className={clsx(
          'font-medium text-gray-900 dark:text-gray-100 truncate',
          currentSize.text
        )}>
          {displayName}
        </span>
      )}
    </div>
  );
};