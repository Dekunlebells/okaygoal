import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight, Filter, MoreVertical, Tv } from 'lucide-react';
import { format } from 'date-fns';
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

export const FotmobMainContent: React.FC = () => {
  const [matches, setMatches] = useState<FotmobMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'ongoing' | 'ontv' | 'bytime'>('ongoing');

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await matchesApi.getTodayMatches();
      setMatches(response.data.data || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [selectedDate]);

  // Group matches by league
  const groupedMatches = React.useMemo(() => {
    const groups: { [leagueId: number]: LeagueGroup } = {};
    
    matches.forEach(match => {
      const leagueId = match.league.id;
      if (!groups[leagueId]) {
        groups[leagueId] = {
          league: match.league,
          matches: [],
        };
      }
      groups[leagueId].matches.push(match);
    });

    return Object.values(groups).sort((a, b) => a.league.name.localeCompare(b.league.name));
  }, [matches]);

  const formatMatchTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a').replace(' ', '');
  };

  const isLive = (status: string) => {
    return status === '1H' || status === '2H' || status === 'HT';
  };

  const isFinished = (status: string) => {
    return status === 'FT' || status === 'AET' || status === 'PEN';
  };

  return (
    <div className="p-6">
      {/* Date Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Today
          </h2>
          <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-6">
          <button
            onClick={() => setActiveTab('ongoing')}
            className={clsx(
              'pb-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'ongoing'
                ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200'
            )}
          >
            Ongoing
          </button>
          <button
            onClick={() => setActiveTab('ontv')}
            className={clsx(
              'flex items-center space-x-2 pb-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'ontv'
                ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200'
            )}
          >
            <Tv className="w-4 h-4" />
            <span>On TV</span>
          </button>
          <button
            onClick={() => setActiveTab('bytime')}
            className={clsx(
              'pb-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'bytime'
                ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200'
            )}
          >
            By time
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          <button className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                      <div className="w-24 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    </div>
                    <div className="w-12 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Matches grouped by league */}
      {!loading && groupedMatches.length > 0 && (
        <div className="space-y-6">
          {groupedMatches.map((group) => (
            <div key={group.league.id}>
              {/* League header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <img 
                    src={group.league.logo} 
                    alt={group.league.name}
                    className="w-5 h-5 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${group.league.name}&size=20&background=e5e7eb&color=6b7280`;
                    }}
                  />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {group.league.country} - {group.league.name}
                  </h3>
                </div>
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Matches */}
              <div className="space-y-2">
                {group.matches.map((match) => (
                  <div
                    key={match.fixture.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                  >
                    {/* Home team */}
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {match.teams.home.name}
                      </span>
                      <img 
                        src={match.teams.home.logo} 
                        alt={match.teams.home.name}
                        className="w-6 h-6 object-contain flex-shrink-0"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://ui-avatars.com/api/?name=${match.teams.home.name}&size=24&background=e5e7eb&color=6b7280`;
                        }}
                      />
                    </div>

                    {/* Score/Time */}
                    <div className="mx-6 text-center">
                      {isLive(match.fixture.status.short) ? (
                        <div className="flex flex-col items-center">
                          <div className="flex items-center space-x-2 text-sm font-bold">
                            <span>{match.goals.home ?? 0}</span>
                            <span className="text-gray-400">-</span>
                            <span>{match.goals.away ?? 0}</span>
                          </div>
                          <div className="flex items-center space-x-1 mt-1">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-red-500 font-medium">
                              {match.fixture.status.elapsed}'
                            </span>
                          </div>
                        </div>
                      ) : isFinished(match.fixture.status.short) ? (
                        <div className="flex items-center space-x-2 text-sm font-bold">
                          <span>{match.goals.home ?? 0}</span>
                          <span className="text-gray-400">-</span>
                          <span>{match.goals.away ?? 0}</span>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {formatMatchTime(match.fixture.date).split('').map((char, index) => 
                            index === formatMatchTime(match.fixture.date).length - 2 ? (
                              <React.Fragment key={index}>
                                <br />
                                <span className="text-xs">{char}</span>
                              </React.Fragment>
                            ) : (
                              <span key={index}>{char}</span>
                            )
                          )}
                        </div>
                      )}
                    </div>

                    {/* Away team */}
                    <div className="flex items-center space-x-3 flex-1 min-w-0 justify-end">
                      <img 
                        src={match.teams.away.logo} 
                        alt={match.teams.away.name}
                        className="w-6 h-6 object-contain flex-shrink-0"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://ui-avatars.com/api/?name=${match.teams.away.name}&size=24&background=e5e7eb&color=6b7280`;
                        }}
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate text-right">
                        {match.teams.away.name}
                      </span>
                    </div>

                    {/* TV indicator */}
                    <div className="ml-4">
                      <button className="w-6 h-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <Tv className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && matches.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">⚽</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No matches today
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Check back later for live scores and upcoming fixtures
          </p>
        </div>
      )}
    </div>
  );
};