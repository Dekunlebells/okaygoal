import React from 'react';
import { clsx } from 'clsx';
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';
import { MatchDetails } from '@/types';
import { TeamBadge } from '@/components/common/TeamBadge';
import { CompetitionBadge } from '@/components/common/CompetitionBadge';
import { MatchStatusBadge } from '@/components/common/MatchStatusBadge';

interface MatchCardProps {
  match: MatchDetails;
  variant?: 'default' | 'compact' | 'detailed';
  showCompetition?: boolean;
  showDate?: boolean;
  onClick?: (match: MatchDetails) => void;
  className?: string;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  variant = 'default',
  showCompetition = true,
  showDate = false,
  onClick,
  className,
}) => {
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';
  const isScheduled = match.status === 'scheduled';

  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isTomorrow(date)) {
      return `Tomorrow ${format(date, 'HH:mm')}`;
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM dd, HH:mm');
    }
  };

  const baseClasses = [
    'bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-gray-700',
    'transition-all duration-200',
  ];

  const interactiveClasses = onClick ? [
    'hover:shadow-card-hover cursor-pointer',
    'hover:border-primary-300 dark:hover:border-primary-600',
  ] : [];

  const liveClasses = isLive ? [
    'border-red-200 dark:border-red-800',
    'shadow-live',
    'bg-red-50/30 dark:bg-red-900/10',
  ] : [];

  const containerClasses = clsx(
    baseClasses,
    interactiveClasses,
    liveClasses,
    className
  );

  if (variant === 'compact') {
    return (
      <div className={containerClasses} onClick={() => onClick?.(match)}>
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <TeamBadge team={match.home_team} size="sm" />
              <div className="flex items-center space-x-2">
                <span className="score-display text-lg">
                  {match.home_score}
                </span>
                <span className="text-gray-400">-</span>
                <span className="score-display text-lg">
                  {match.away_score}
                </span>
              </div>
              <TeamBadge team={match.away_team} size="sm" />
            </div>
            
            <div className="flex items-center space-x-2">
              <MatchStatusBadge status={match.status} minute={match.minute} size="xs" />
            </div>
          </div>
          
          {showCompetition && match.competition && (
            <div className="mt-2">
              <CompetitionBadge competition={match.competition} size="xs" />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={containerClasses} onClick={() => onClick?.(match)}>
        <div className="p-4">
          {/* Header with competition and date */}
          {(showCompetition || showDate) && (
            <div className="flex items-center justify-between mb-3">
              {showCompetition && match.competition && (
                <CompetitionBadge competition={match.competition} />
              )}
              {showDate && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatMatchDate(match.match_date)}
                </span>
              )}
            </div>
          )}

          {/* Main match info */}
          <div className="flex items-center justify-between">
            {/* Home team */}
            <div className="flex flex-col items-center space-y-2 flex-1">
              <TeamBadge team={match.home_team} size="lg" />
              <span className="text-sm font-medium text-center truncate w-full">
                {match.home_team.name}
              </span>
            </div>

            {/* Score and status */}
            <div className="flex flex-col items-center space-y-2 px-4">
              {isScheduled ? (
                <div className="text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatMatchDate(match.match_date)}
                  </div>
                  <MatchStatusBadge status={match.status} size="sm" />
                </div>
              ) : (
                <>
                  <div className="flex items-center space-x-1">
                    <span className="score-display-lg">{match.home_score}</span>
                    <span className="text-2xl text-gray-400 mx-2">-</span>
                    <span className="score-display-lg">{match.away_score}</span>
                  </div>
                  <MatchStatusBadge status={match.status} minute={match.minute} />
                </>
              )}
            </div>

            {/* Away team */}
            <div className="flex flex-col items-center space-y-2 flex-1">
              <TeamBadge team={match.away_team} size="lg" />
              <span className="text-sm font-medium text-center truncate w-full">
                {match.away_team.name}
              </span>
            </div>
          </div>

          {/* Additional info */}
          {(match.venue_name || match.referee) && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                {match.venue_name && <span>{match.venue_name}</span>}
                {match.referee && <span>Ref: {match.referee}</span>}
              </div>
            </div>
          )}

          {/* Recent events for live matches */}
          {isLive && match.events && match.events.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="space-y-1">
                {match.events.slice(0, 3).map((event) => (
                  <div key={event.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">
                      {event.time_minute}' {event.player?.name || 'Player'}
                    </span>
                    <span>
                      {event.type === 'goal' && '⚽'}
                      {event.type === 'card' && (event.subtype === 'red_card' ? '🟥' : '🟨')}
                      {event.type === 'substitution' && '🔄'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={containerClasses} onClick={() => onClick?.(match)}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          {showCompetition && match.competition && (
            <CompetitionBadge competition={match.competition} />
          )}
          <MatchStatusBadge status={match.status} minute={match.minute} />
        </div>

        {/* Match teams and score */}
        <div className="flex items-center justify-between">
          {/* Home team */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <TeamBadge team={match.home_team} size="md" />
            <span className="font-medium truncate">
              {match.home_team.name}
            </span>
          </div>

          {/* Score */}
          <div className="flex items-center space-x-3 mx-4">
            {isScheduled ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {formatMatchDate(match.match_date)}
              </div>
            ) : (
              <>
                <span className="score-display">{match.home_score}</span>
                <span className="text-gray-400">-</span>
                <span className="score-display">{match.away_score}</span>
              </>
            )}
          </div>

          {/* Away team */}
          <div className="flex items-center space-x-3 flex-1 min-w-0 justify-end">
            <span className="font-medium truncate text-right">
              {match.away_team.name}
            </span>
            <TeamBadge team={match.away_team} size="md" />
          </div>
        </div>

        {/* Match details */}
        {showDate && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {formatMatchDate(match.match_date)}
              {match.venue_name && ` • ${match.venue_name}`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};