import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { MatchCard } from './MatchCard';
import { useAppSelector, useAppDispatch } from '@/store';
import {
  selectLiveMatches,
  selectTodayMatches,
  selectMatchesLoading,
  selectMatchesError,
  selectLastUpdated,
  fetchLiveMatches,
  fetchTodayMatches,
  clearError,
} from '@/store/slices/matchesSlice';
import { websocketService } from '@/services/websocket';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface LiveScoresDashboardProps {
  className?: string;
}

export const LiveScoresDashboard: React.FC<LiveScoresDashboardProps> = ({
  className,
}) => {
  const dispatch = useAppDispatch();
  const liveMatches = useAppSelector(selectLiveMatches);
  const todayMatches = useAppSelector(selectTodayMatches);
  const isLoading = useAppSelector(selectMatchesLoading);
  const error = useAppSelector(selectMatchesError);
  const lastUpdated = useAppSelector(selectLastUpdated);

  const [wsStatus, setWsStatus] = useState<'connecting' | 'open' | 'closed' | 'error'>('closed');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // WebSocket connection status monitoring
  useEffect(() => {
    const checkConnection = () => {
      setWsStatus(websocketService.getConnectionStatus());
    };

    const interval = setInterval(checkConnection, 1000);
    checkConnection();

    return () => clearInterval(interval);
  }, []);

  // Auto-refresh for matches when WebSocket is not connected
  useEffect(() => {
    if (!autoRefresh || wsStatus === 'open') return;

    const interval = setInterval(() => {
      dispatch(fetchLiveMatches());
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [dispatch, autoRefresh, wsStatus]);

  // Initial data fetch
  useEffect(() => {
    dispatch(fetchLiveMatches());
    dispatch(fetchTodayMatches());

    // Subscribe to live scores if WebSocket is connected
    if (websocketService.isConnected()) {
      websocketService.subscribeToLiveScores();
    }
  }, [dispatch]);

  // Handle manual refresh
  const handleRefresh = async () => {
    dispatch(clearError());
    await Promise.all([
      dispatch(fetchLiveMatches()),
      dispatch(fetchTodayMatches()),
    ]);
  };

  // Filter today's matches to exclude live ones (avoid duplication)
  const scheduledTodayMatches = todayMatches.filter(match => 
    match.status === 'scheduled' || match.status === 'finished'
  );

  const formatLastUpdated = (timestamp: string | null) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);

    if (diffSeconds < 60) return 'Just now';
    if (diffMinutes === 1) return '1 minute ago';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const connectionStatusConfig = {
    open: { icon: Wifi, color: 'text-green-500', label: 'Live' },
    connecting: { icon: Wifi, color: 'text-yellow-500', label: 'Connecting' },
    closed: { icon: WifiOff, color: 'text-gray-500', label: 'Offline' },
    error: { icon: WifiOff, color: 'text-red-500', label: 'Error' },
  };

  const statusConfig = connectionStatusConfig[wsStatus];
  const StatusIcon = statusConfig.icon;

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Live Scores
          </h1>
          <div className="flex items-center space-x-4 mt-1">
            <div className="flex items-center space-x-1.5">
              <StatusIcon className={clsx('w-4 h-4', statusConfig.color)} />
              <span className={clsx('text-sm font-medium', statusConfig.color)}>
                {statusConfig.label}
              </span>
            </div>
            {lastUpdated && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Updated {formatLastUpdated(lastUpdated)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {liveMatches.length > 0 && (
            <Badge variant="danger" size="sm" dot>
              {liveMatches.length} Live
            </Badge>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            loading={isLoading}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {error}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => dispatch(clearError())}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Live matches */}
      {liveMatches.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Live Now
            </h2>
            <Badge variant="danger" size="sm" dot>
              {liveMatches.length} {liveMatches.length === 1 ? 'match' : 'matches'}
            </Badge>
          </div>
          
          <div className="grid gap-4">
            {liveMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                variant="detailed"
                showCompetition
                className="animate-slide-up"
              />
            ))}
          </div>
        </section>
      )}

      {/* Today's other matches */}
      {scheduledTodayMatches.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Today's Matches
          </h2>
          
          <div className="grid gap-3">
            {scheduledTodayMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                showCompetition
                className="animate-slide-up"
                style={{ animationDelay: `${scheduledTodayMatches.indexOf(match) * 50}ms` }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!isLoading && liveMatches.length === 0 && scheduledTodayMatches.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚽</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No matches today
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Check back later for live scores and upcoming fixtures
          </p>
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="mt-4"
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Check for updates
          </Button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && liveMatches.length === 0 && scheduledTodayMatches.length === 0 && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-32"></div>
            </div>
          ))}
        </div>
      )}

      {/* Connection settings */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Real-time Updates
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {wsStatus === 'open' 
                ? 'Receiving live updates via WebSocket'
                : 'Auto-refreshing every 30 seconds'
              }
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Auto-refresh
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};