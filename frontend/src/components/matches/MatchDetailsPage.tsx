import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  User, 
  TrendingUp, 
  Activity,
  Users,
  Target,
  BarChart3
} from 'lucide-react';

import { useAppSelector, useAppDispatch } from '@/store';
import { 
  selectSelectedMatch, 
  selectMatchesLoading,
  fetchMatchDetails,
  setSelectedMatch
} from '@/store/slices/matchesSlice';
import { MatchDetails, MatchEvent, MatchStatistics } from '@/types';
import { TeamBadge } from '@/components/common/TeamBadge';
import { CompetitionBadge } from '@/components/common/CompetitionBadge';
import { MatchStatusBadge } from '@/components/common/MatchStatusBadge';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { websocketService } from '@/services/websocket';

interface MatchDetailsPageProps {
  matchId?: string;
}

export const MatchDetailsPage: React.FC<MatchDetailsPageProps> = ({ matchId: propMatchId }) => {
  const { id: paramMatchId } = useParams<{ id: string }>();
  const matchId = propMatchId || paramMatchId;
  
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const match = useAppSelector(selectSelectedMatch);
  const isLoading = useAppSelector(selectMatchesLoading);
  
  const [activeTab, setActiveTab] = useState<'events' | 'stats' | 'lineups'>('events');

  useEffect(() => {
    if (matchId) {
      const numericMatchId = parseInt(matchId);
      dispatch(fetchMatchDetails(numericMatchId));
      
      // Subscribe to live updates for this match
      if (websocketService.isConnected()) {
        websocketService.subscribeToMatch(numericMatchId);
      }
      
      return () => {
        // Unsubscribe when leaving
        websocketService.unsubscribeFromMatch(numericMatchId);
      };
    }
  }, [matchId, dispatch]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      dispatch(setSelectedMatch(null));
    };
  }, [dispatch]);

  if (isLoading && !match) {
    return <MatchDetailsLoader />;
  }

  if (!match) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⚽</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Match not found
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          The match you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => navigate('/')} variant="outline">
          Back to Home
        </Button>
      </div>
    );
  }

  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate(-1)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back
        </Button>
        
        {match.competition && (
          <CompetitionBadge competition={match.competition} />
        )}
        
        {isLive && (
          <Badge variant="danger" size="sm" dot className="animate-pulse">
            LIVE
          </Badge>
        )}
      </div>

      {/* Match Header */}
      <div className="bg-white dark:bg-dark-surface rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          {/* Home Team */}
          <div className="flex flex-col items-center space-y-3 flex-1">
            <TeamBadge team={match.home_team} size="xl" />
            <h2 className="text-xl font-bold text-center">{match.home_team.name}</h2>
          </div>

          {/* Score and Status */}
          <div className="flex flex-col items-center space-y-4 px-8">
            <div className="text-center">
              {match.status === 'scheduled' ? (
                <div>
                  <div className="text-lg font-medium text-gray-600 dark:text-gray-400">
                    {new Date(match.match_date).toLocaleDateString()}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {new Date(match.match_date).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <span className="text-5xl font-black text-gray-900 dark:text-white">
                    {match.home_score}
                  </span>
                  <span className="text-3xl text-gray-400">-</span>
                  <span className="text-5xl font-black text-gray-900 dark:text-white">
                    {match.away_score}
                  </span>
                </div>
              )}
            </div>
            
            <MatchStatusBadge 
              status={match.status} 
              minute={match.minute} 
              size="md" 
            />
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center space-y-3 flex-1">
            <TeamBadge team={match.away_team} size="xl" />
            <h2 className="text-xl font-bold text-center">{match.away_team.name}</h2>
          </div>
        </div>

        {/* Match Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {match.match_date && (
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span>{new Date(match.match_date).toLocaleString()}</span>
            </div>
          )}
          
          {match.venue_name && (
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <MapPin className="w-4 h-4" />
              <span>{match.venue_name}</span>
            </div>
          )}
          
          {match.referee && (
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <User className="w-4 h-4" />
              <span>Ref: {match.referee}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { key: 'events', label: 'Events', icon: Activity },
              { key: 'stats', label: 'Statistics', icon: BarChart3 },
              { key: 'lineups', label: 'Lineups', icon: Users },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === key
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'events' && <MatchEvents match={match} />}
          {activeTab === 'stats' && <MatchStats match={match} />}
          {activeTab === 'lineups' && <MatchLineups match={match} />}
        </div>
      </div>
    </div>
  );
};

// Match Events Component
const MatchEvents: React.FC<{ match: MatchDetails }> = ({ match }) => {
  const events = match.events || [];

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          {match.status === 'scheduled' ? 'Match events will appear here when the match starts' : 'No match events recorded'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Match Events</h3>
      
      <div className="space-y-3">
        {events.map((event, index) => (
          <MatchEventItem key={event.id || index} event={event} match={match} />
        ))}
      </div>
    </div>
  );
};

// Individual Match Event
const MatchEventItem: React.FC<{ event: MatchEvent; match: MatchDetails }> = ({ event, match }) => {
  const isHomeTeam = event.team_id === match.home_team_id;
  
  const getEventIcon = (type: string, subtype?: string) => {
    switch (type) {
      case 'goal':
        return '⚽';
      case 'card':
        return subtype === 'red_card' ? '🟥' : '🟨';
      case 'substitution':
        return '🔄';
      case 'penalty':
        return '🎯';
      case 'var':
        return '📹';
      default:
        return '⚪';
    }
  };

  const getEventDescription = (event: MatchEvent) => {
    let description = event.player?.name || 'Player';
    
    if (event.type === 'goal' && event.assist_player?.name) {
      description += ` (Assist: ${event.assist_player.name})`;
    }
    
    if (event.detail) {
      description += ` - ${event.detail}`;
    }
    
    return description;
  };

  return (
    <div className={`flex items-center space-x-4 p-3 rounded-lg ${
      isHomeTeam ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-red-50 dark:bg-red-900/20'
    }`}>
      <div className="flex-shrink-0 text-2xl">
        {getEventIcon(event.type, event.subtype)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-900 dark:text-white">
            {event.time_minute}'
            {event.time_extra && `+${event.time_extra}`}
          </span>
          <Badge variant={event.type === 'goal' ? 'success' : 'default'} size="xs">
            {event.type.toUpperCase()}
          </Badge>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {getEventDescription(event)}
        </p>
        
        {event.comments && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {event.comments}
          </p>
        )}
      </div>
      
      <div className="flex-shrink-0">
        <TeamBadge team={isHomeTeam ? match.home_team : match.away_team} size="sm" />
      </div>
    </div>
  );
};

// Match Statistics Component
const MatchStats: React.FC<{ match: MatchDetails }> = ({ match }) => {
  const stats = match.statistics || [];

  if (stats.length === 0) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          Match statistics will be available during and after the match
        </p>
      </div>
    );
  }

  const homeStats = stats.find(s => s.team_id === match.home_team_id);
  const awayStats = stats.find(s => s.team_id === match.away_team_id);

  const statItems = [
    { label: 'Possession', homeValue: homeStats?.possession_percentage, awayValue: awayStats?.possession_percentage, format: '%' },
    { label: 'Shots', homeValue: homeStats?.shots_total, awayValue: awayStats?.shots_total },
    { label: 'On Target', homeValue: homeStats?.shots_on_target, awayValue: awayStats?.shots_on_target },
    { label: 'Corners', homeValue: homeStats?.corners, awayValue: awayStats?.corners },
    { label: 'Fouls', homeValue: homeStats?.fouls, awayValue: awayStats?.fouls },
    { label: 'Yellow Cards', homeValue: homeStats?.yellow_cards, awayValue: awayStats?.yellow_cards },
    { label: 'Red Cards', homeValue: homeStats?.red_cards, awayValue: awayStats?.red_cards },
    { label: 'Passes', homeValue: homeStats?.passes_total, awayValue: awayStats?.passes_total },
    { label: 'Pass Accuracy', homeValue: homeStats?.passes_percentage, awayValue: awayStats?.passes_percentage, format: '%' },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Match Statistics</h3>
      
      <div className="space-y-4">
        {statItems.map((stat) => (
          <StatItem
            key={stat.label}
            label={stat.label}
            homeValue={stat.homeValue}
            awayValue={stat.awayValue}
            homeTeam={match.home_team.name}
            awayTeam={match.away_team.name}
            format={stat.format}
          />
        ))}
      </div>

      {(homeStats?.expected_goals || awayStats?.expected_goals) && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="font-medium mb-3">Expected Goals (xG)</h4>
          <StatItem
            label="xG"
            homeValue={homeStats?.expected_goals}
            awayValue={awayStats?.expected_goals}
            homeTeam={match.home_team.name}
            awayTeam={match.away_team.name}
            format="decimal"
          />
        </div>
      )}
    </div>
  );
};

// Statistic Item Component
interface StatItemProps {
  label: string;
  homeValue?: number;
  awayValue?: number;
  homeTeam: string;
  awayTeam: string;
  format?: '%' | 'decimal';
}

const StatItem: React.FC<StatItemProps> = ({ 
  label, 
  homeValue = 0, 
  awayValue = 0, 
  homeTeam, 
  awayTeam,
  format 
}) => {
  const total = homeValue + awayValue;
  const homePercent = total > 0 ? (homeValue / total) * 100 : 50;
  const awayPercent = total > 0 ? (awayValue / total) * 100 : 50;

  const formatValue = (value: number) => {
    if (format === '%') return `${value}%`;
    if (format === 'decimal') return value.toFixed(2);
    return value.toString();
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{formatValue(homeValue)}</span>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</span>
        <span className="text-sm font-medium">{formatValue(awayValue)}</span>
      </div>
      
      <div className="flex h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
        <div 
          className="bg-blue-500 transition-all duration-300"
          style={{ width: `${homePercent}%` }}
        />
        <div 
          className="bg-red-500 transition-all duration-300"
          style={{ width: `${awayPercent}%` }}
        />
      </div>
    </div>
  );
};

// Match Lineups Component
const MatchLineups: React.FC<{ match: MatchDetails }> = ({ match }) => {
  return (
    <div className="text-center py-8">
      <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
      <p className="text-gray-500 dark:text-gray-400">
        Team lineups will be available closer to kick-off
      </p>
      <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
        This feature will be implemented in the next update
      </p>
    </div>
  );
};

// Loading Component
const MatchDetailsLoader: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64"></div>
      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-96"></div>
    </div>
  );
};

export default MatchDetailsPage;