import React from 'react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { Play, Clock, CheckCircle } from 'lucide-react';

interface FotmobMatch {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      long: string;
      elapsed?: number;
    };
    venue?: {
      name?: string;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
    };
    away: {
      id: number;
      name: string;
      logo: string;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

interface FotmobMatchCardProps {
  match: FotmobMatch;
  onClick?: (match: FotmobMatch) => void;
  className?: string;
}

export const FotmobMatchCard: React.FC<FotmobMatchCardProps> = ({
  match,
  onClick,
  className,
}) => {
  const isLive = match.fixture.status.short === '1H' || 
                 match.fixture.status.short === '2H' || 
                 match.fixture.status.short === 'HT' ||
                 match.fixture.status.short === 'ET';
  const isFinished = match.fixture.status.short === 'FT' || 
                     match.fixture.status.short === 'AET' || 
                     match.fixture.status.short === 'PEN';
  const isScheduled = match.fixture.status.short === 'TBD' || 
                      match.fixture.status.short === 'NS';

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm');
  };

  const getStatusDisplay = () => {
    if (isLive) {
      return (
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-red-500 font-medium text-xs">
            {match.fixture.status.elapsed}'
          </span>
        </div>
      );
    }
    
    if (isFinished) {
      return (
        <div className="flex items-center space-x-1">
          <CheckCircle className="w-3 h-3 text-green-500" />
          <span className="text-green-500 text-xs font-medium">FT</span>
        </div>
      );
    }

    if (isScheduled) {
      return (
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3 text-gray-400" />
          <span className="text-gray-500 text-xs">{formatTime(match.fixture.date)}</span>
        </div>
      );
    }

    return (
      <span className="text-gray-500 text-xs">{match.fixture.status.short}</span>
    );
  };

  const getScoreDisplay = () => {
    if (isScheduled) {
      return (
        <div className="text-center">
          <div className="text-gray-400 text-sm font-medium">vs</div>
        </div>
      );
    }

    return (
      <div className="text-center">
        <div className="flex items-center space-x-2">
          <span className={clsx(
            'text-xl font-bold',
            isLive ? 'text-red-600' : 'text-gray-900 dark:text-white'
          )}>
            {match.goals.home ?? 0}
          </span>
          <span className="text-gray-400">-</span>
          <span className={clsx(
            'text-xl font-bold',
            isLive ? 'text-red-600' : 'text-gray-900 dark:text-white'
          )}>
            {match.goals.away ?? 0}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div
      className={clsx(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
        'hover:shadow-md transition-all duration-200',
        isLive && 'border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-900/10',
        onClick && 'cursor-pointer hover:border-blue-300 dark:hover:border-blue-600',
        className
      )}
      onClick={() => onClick?.(match)}
    >
      <div className="p-4">
        {/* League info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <img 
              src={match.league.logo} 
              alt={match.league.name}
              className="w-4 h-4 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://ui-avatars.com/api/?name=${match.league.name}&size=16&background=e5e7eb&color=6b7280`;
              }}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              {match.league.name}
            </span>
          </div>
          {getStatusDisplay()}
        </div>

        {/* Teams and score */}
        <div className="flex items-center justify-between">
          {/* Home team */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <img 
                src={match.teams.home.logo} 
                alt={match.teams.home.name}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${match.teams.home.name}&size=32&background=e5e7eb&color=6b7280`;
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-sm font-medium text-gray-900 dark:text-white truncate block">
                {match.teams.home.name}
              </span>
            </div>
          </div>

          {/* Score */}
          <div className="mx-6">
            {getScoreDisplay()}
          </div>

          {/* Away team */}
          <div className="flex items-center space-x-3 flex-1 min-w-0 justify-end">
            <div className="min-w-0 flex-1 text-right">
              <span className="text-sm font-medium text-gray-900 dark:text-white truncate block">
                {match.teams.away.name}
              </span>
            </div>
            <div className="flex-shrink-0">
              <img 
                src={match.teams.away.logo} 
                alt={match.teams.away.name}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${match.teams.away.name}&size=32&background=e5e7eb&color=6b7280`;
                }}
              />
            </div>
          </div>
        </div>

        {/* Venue info for live matches */}
        {isLive && match.fixture.venue?.name && (
          <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {match.fixture.venue.name}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};