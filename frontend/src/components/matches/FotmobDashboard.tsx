import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { ChevronDown, Filter, RefreshCw, Calendar, TrendingUp } from 'lucide-react';
import { FotmobMatchCard } from './FotmobMatchCard';
import { matchesApi } from '@/services/api';

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

interface LeagueGroup {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
  };
  matches: FotmobMatch[];
}

const popularLeagues = [
  { id: 0, name: 'All', logo: '' },
  { id: 39, name: 'Premier League', logo: '' },
  { id: 140, name: 'La Liga', logo: '' },
  { id: 78, name: 'Bundesliga', logo: '' },
  { id: 135, name: 'Serie A', logo: '' },
  { id: 61, name: 'Ligue 1', logo: '' },
  { id: 2, name: 'Champions League', logo: '' },
];

export const FotmobDashboard: React.FC = () => {
  const [matches, setMatches] = useState<FotmobMatch[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<FotmobMatch[]>([]);
  const [selectedLeague, setSelectedLeague] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'today' | 'tomorrow'>('live');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);

      let data: any[] = [];
      
      if (activeTab === 'live') {
        const response = await matchesApi.getLiveMatches();
        data = response.data.data || [];
      } else if (activeTab === 'today') {
        const response = await matchesApi.getTodayMatches();
        data = response.data.data || [];
      }

      setMatches(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  // Filter matches by selected league
  useEffect(() => {
    if (selectedLeague === 0) {
      setFilteredMatches(matches);
    } else {
      setFilteredMatches(matches.filter(match => match.league.id === selectedLeague));
    }
  }, [matches, selectedLeague]);

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchMatches();
    
    const interval = setInterval(() => {
      if (activeTab === 'live') {
        fetchMatches();
      }
    }, 30000); // Refresh every 30 seconds for live matches

    return () => clearInterval(interval);
  }, [activeTab]);

  // Group matches by league
  const groupedMatches = React.useMemo(() => {
    const groups: { [leagueId: number]: LeagueGroup } = {};
    
    filteredMatches.forEach(match => {
      const leagueId = match.league.id;
      if (!groups[leagueId]) {
        groups[leagueId] = {
          league: match.league,
          matches: [],
        };
      }
      groups[leagueId].matches.push(match);
    });

    return Object.values(groups).sort((a, b) => {
      // Sort by number of matches (descending) then by league name
      if (a.matches.length !== b.matches.length) {
        return b.matches.length - a.matches.length;
      }
      return a.league.name.localeCompare(b.league.name);
    });
  }, [filteredMatches]);

  const liveCount = matches.filter(m => 
    m.fixture.status.short === '1H' || 
    m.fixture.status.short === '2H' || 
    m.fixture.status.short === 'HT'
  ).length;

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);
    
    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    return lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                OkayGoal
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {lastUpdated && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatLastUpdated()}
                </span>
              )}
              <button
                onClick={fetchMatches}
                disabled={loading}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
              >
                <RefreshCw className={clsx('w-5 h-5', loading && 'animate-spin')} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 mb-6">
          <button
            onClick={() => setActiveTab('live')}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'live'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            )}
          >
            <div className="flex items-center space-x-2">
              <div className={clsx(
                'w-2 h-2 rounded-full',
                activeTab === 'live' ? 'bg-red-500 animate-pulse' : 'bg-gray-400'
              )} />
              <span>Live</span>
              {liveCount > 0 && <span className="text-xs">({liveCount})</span>}
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('today')}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'today'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            )}
          >
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Today</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('tomorrow')}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'tomorrow'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            )}
          >
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Tomorrow</span>
            </div>
          </button>
        </div>

        {/* League Filter */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            {popularLeagues.map((league) => (
              <button
                key={league.id}
                onClick={() => setSelectedLeague(league.id)}
                className={clsx(
                  'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  selectedLeague === league.id
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700'
                )}
              >
                {league.name}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && matches.length === 0 && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Matches grouped by league */}
        {!loading && groupedMatches.length > 0 && (
          <div className="space-y-6">
            {groupedMatches.map((group) => (
              <div key={group.league.id} className="space-y-3">
                {/* League header */}
                <div className="flex items-center space-x-3 pb-2">
                  <img 
                    src={group.league.logo} 
                    alt={group.league.name}
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${group.league.name}&size=24&background=e5e7eb&color=6b7280`;
                    }}
                  />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {group.league.name}
                  </h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({group.matches.length})
                  </span>
                </div>

                {/* Matches */}
                <div className="space-y-2">
                  {group.matches.map((match) => (
                    <FotmobMatchCard
                      key={match.fixture.id}
                      match={match}
                      onClick={(match) => {
                        console.log('Match clicked:', match);
                        // Navigate to match details
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredMatches.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚽</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No matches found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {selectedLeague === 0 
                ? 'There are no matches available right now.'
                : 'No matches found for the selected league.'
              }
            </p>
            <button
              onClick={() => setSelectedLeague(0)}
              className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
            >
              Show all matches
            </button>
          </div>
        )}
      </div>
    </div>
  );
};