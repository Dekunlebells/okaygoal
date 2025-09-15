import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight, Filter, MoreVertical, Tv, Star, TrendingUp, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { format, addDays, subDays, isToday, isTomorrow, isYesterday } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { matchesApi } from '@/services/api';
import { MatchDetails } from '@/types';

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

interface FotmobMainContentProps {
  selectedLeague?: number;
}

// Convert API MatchDetails to our display format
const convertApiMatchToDisplay = (match: MatchDetails): FotmobMatch => {
  const getStatus = (status: string, minute?: number) => {
    switch (status) {
      case 'live':
        return { 
          short: minute && minute > 45 ? '2H' : '1H', 
          long: minute && minute > 45 ? 'Second Half' : 'First Half',
          elapsed: minute 
        };
      case 'finished':
        return { short: 'FT', long: 'Match Finished' };
      case 'scheduled':
        return { short: 'NS', long: 'Not Started' };
      default:
        return { short: 'NS', long: 'Not Started' };
    }
  };

  return {
    fixture: {
      id: match.id,
      date: match.match_date,
      status: getStatus(match.status, match.minute),
      venue: { name: match.venue_name || '' }
    },
    league: {
      id: match.competition.id,
      name: match.competition.name,
      country: match.competition.country || '',
      logo: match.competition.logo_url || `https://ui-avatars.com/api/?name=${match.competition.name}&size=20&background=e5e7eb&color=6b7280`
    },
    teams: {
      home: {
        id: match.home_team.id,
        name: match.home_team.name,
        logo: match.home_team.logo_url || `https://ui-avatars.com/api/?name=${match.home_team.name}&size=24&background=e5e7eb&color=6b7280`
      },
      away: {
        id: match.away_team.id,
        name: match.away_team.name,
        logo: match.away_team.logo_url || `https://ui-avatars.com/api/?name=${match.away_team.name}&size=24&background=e5e7eb&color=6b7280`
      }
    },
    goals: {
      home: match.status === 'scheduled' ? null : match.home_score,
      away: match.status === 'scheduled' ? null : match.away_score
    }
  };
};

export const FotmobMainContent: React.FC<FotmobMainContentProps> = ({ selectedLeague = 0 }) => {
  const navigate = useNavigate();
  const [clickedMatchId, setClickedMatchId] = useState<number | null>(null);
  
  // Generate demo matches for multiple days
  const generateDemoMatches = (dateOffset: number): FotmobMatch[] => {
    const targetDate = addDays(new Date(), dateOffset);
    const baseId = Math.abs(dateOffset) * 100;
    
    // Different match scenarios based on date offset
    if (dateOffset === 0) { // Today
      return [
        {
          fixture: {
            id: baseId + 1,
            date: targetDate.toISOString(),
            status: { short: '2H', long: 'Second Half', elapsed: 67 },
            venue: { name: 'Old Trafford' }
          },
          league: {
            id: 39,
            name: 'Premier League',
            country: 'England',
            logo: 'https://media.api-sports.io/football/leagues/39.png'
          },
          teams: {
            home: { id: 33, name: 'Manchester United', logo: 'https://media.api-sports.io/football/teams/33.png' },
            away: { id: 40, name: 'Liverpool', logo: 'https://media.api-sports.io/football/teams/40.png' }
          },
          goals: { home: 2, away: 1 }
        },
        {
          fixture: {
            id: baseId + 2,
            date: new Date(targetDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
            status: { short: 'NS', long: 'Not Started' },
            venue: { name: 'Emirates Stadium' }
          },
          league: {
            id: 39,
            name: 'Premier League',
            country: 'England',
            logo: 'https://media.api-sports.io/football/leagues/39.png'
          },
          teams: {
            home: { id: 42, name: 'Arsenal', logo: 'https://media.api-sports.io/football/teams/42.png' },
            away: { id: 49, name: 'Chelsea', logo: 'https://media.api-sports.io/football/teams/49.png' }
          },
          goals: { home: null, away: null }
        },
        {
          fixture: {
            id: baseId + 3,
            date: targetDate.toISOString(),
            status: { short: '1H', long: 'First Half', elapsed: 23 },
            venue: { name: 'Camp Nou' }
          },
          league: {
            id: 135,
            name: 'LaLiga',
            country: 'Spain',
            logo: 'https://media.api-sports.io/football/leagues/135.png'
          },
          teams: {
            home: { id: 529, name: 'Barcelona', logo: 'https://media.api-sports.io/football/teams/529.png' },
            away: { id: 541, name: 'Real Madrid', logo: 'https://media.api-sports.io/football/teams/541.png' }
          },
          goals: { home: 1, away: 0 }
        }
      ];
    } else if (dateOffset === -1) { // Yesterday
      return [
        {
          fixture: {
            id: baseId + 1,
            date: targetDate.toISOString(),
            status: { short: 'FT', long: 'Match Finished' },
            venue: { name: 'Etihad Stadium' }
          },
          league: {
            id: 39,
            name: 'Premier League',
            country: 'England',
            logo: 'https://media.api-sports.io/football/leagues/39.png'
          },
          teams: {
            home: { id: 50, name: 'Manchester City', logo: 'https://media.api-sports.io/football/teams/50.png' },
            away: { id: 47, name: 'Tottenham', logo: 'https://media.api-sports.io/football/teams/47.png' }
          },
          goals: { home: 3, away: 0 }
        },
        {
          fixture: {
            id: baseId + 2,
            date: targetDate.toISOString(),
            status: { short: 'FT', long: 'Match Finished' },
            venue: { name: 'Allianz Arena' }
          },
          league: {
            id: 2,
            name: 'Champions League',
            country: 'Europe',
            logo: 'https://media.api-sports.io/football/leagues/2.png'
          },
          teams: {
            home: { id: 157, name: 'Bayern Munich', logo: 'https://media.api-sports.io/football/teams/157.png' },
            away: { id: 529, name: 'Barcelona', logo: 'https://media.api-sports.io/football/teams/529.png' }
          },
          goals: { home: 2, away: 1 }
        }
      ];
    } else if (dateOffset === 1) { // Tomorrow
      return [
        {
          fixture: {
            id: baseId + 1,
            date: new Date(targetDate.getTime() + 15 * 60 * 60 * 1000).toISOString(),
            status: { short: 'NS', long: 'Not Started' },
            venue: { name: 'Stamford Bridge' }
          },
          league: {
            id: 2,
            name: 'Champions League',
            country: 'Europe',
            logo: 'https://media.api-sports.io/football/leagues/2.png'
          },
          teams: {
            home: { id: 49, name: 'Chelsea', logo: 'https://media.api-sports.io/football/teams/49.png' },
            away: { id: 157, name: 'Bayern Munich', logo: 'https://media.api-sports.io/football/teams/157.png' }
          },
          goals: { home: null, away: null }
        },
        {
          fixture: {
            id: baseId + 2,
            date: new Date(targetDate.getTime() + 17 * 60 * 60 * 1000).toISOString(),
            status: { short: 'NS', long: 'Not Started' },
            venue: { name: 'Santiago Bernabéu' }
          },
          league: {
            id: 135,
            name: 'LaLiga',
            country: 'Spain',
            logo: 'https://media.api-sports.io/football/leagues/135.png'
          },
          teams: {
            home: { id: 541, name: 'Real Madrid', logo: 'https://media.api-sports.io/football/teams/541.png' },
            away: { id: 42, name: 'Arsenal', logo: 'https://media.api-sports.io/football/teams/42.png' }
          },
          goals: { home: null, away: null }
        }
      ];
    } else {
      // Other dates - fewer matches
      return [
        {
          fixture: {
            id: baseId + 1,
            date: new Date(targetDate.getTime() + 15 * 60 * 60 * 1000).toISOString(),
            status: { short: 'NS', long: 'Not Started' },
            venue: { name: 'Anfield' }
          },
          league: {
            id: 39,
            name: 'Premier League',
            country: 'England',
            logo: 'https://media.api-sports.io/football/leagues/39.png'
          },
          teams: {
            home: { id: 40, name: 'Liverpool', logo: 'https://media.api-sports.io/football/teams/40.png' },
            away: { id: 33, name: 'Manchester United', logo: 'https://media.api-sports.io/football/teams/33.png' }
          },
          goals: { home: null, away: null }
        }
      ];
    }
  };

  const [matches, setMatches] = useState<FotmobMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'ongoing' | 'ontv' | 'bytime'>('ongoing');
  const [error, setError] = useState<string | null>(null);
  const [usingRealData, setUsingRealData] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let apiMatches: MatchDetails[] = [];
      
      // Get date string for API calls
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      const isToday = format(new Date(), 'yyyy-MM-dd') === dateString;
      
      if (activeTab === 'ongoing') {
        // Get live matches
        const response = await matchesApi.getLiveMatches();
        console.log('Live matches response:', response.data);
        if (response.data.success) {
          apiMatches = response.data.data || [];
        }
      } else if (activeTab === 'bytime') {
        // Get matches by selected date
        if (isToday) {
          const response = await matchesApi.getTodayMatches();
          console.log('Today matches response:', response.data);
          if (response.data.success) {
            apiMatches = response.data.data || [];
          }
        } else {
          const response = await matchesApi.getMatchesByDate(dateString);
          console.log('Matches by date response:', response.data);
          if (response.data.success) {
            apiMatches = response.data.data || [];
          }
        }
      } else if (activeTab === 'ontv') {
        // For "On TV" - get today's matches and filter for major competitions
        const response = await matchesApi.getTodayMatches();
        console.log('On TV matches response:', response.data);
        if (response.data.success) {
          // Filter for major competitions (Champions League, Premier League, etc.)
          const majorCompetitionIds = [2, 39, 135, 140]; // CL, PL, LaLiga, Championship
          apiMatches = (response.data.data || []).filter(match => 
            majorCompetitionIds.includes(match.competition_id)
          );
        }
      }
      
      console.log('API matches received:', apiMatches);
      
      // Convert API matches to display format
      const convertedMatches = apiMatches.map(convertApiMatchToDisplay);
      
      // Calculate date offset for demo data fallback
      const dateOffset = Math.round((selectedDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const demoMatches = generateDemoMatches(dateOffset);
      
      // Use real API data if available, otherwise fall back to demo data
      if (convertedMatches.length > 0) {
        console.log('Using real API matches:', convertedMatches);
        setMatches(convertedMatches);
        setUsingRealData(true);
      } else {
        console.log('No real matches found, showing demo data for better UX');
        setMatches(demoMatches);
        setUsingRealData(false);
      }
      
      setLastRefresh(new Date());
      
    } catch (error) {
      console.error('Error fetching matches:', error);
      setError('Failed to load matches');
      
      // Use demo data as fallback on error
      const dateOffset = Math.round((selectedDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const demoMatches = generateDemoMatches(dateOffset);
      setMatches(demoMatches);
      setUsingRealData(false);
    } finally {
      setLoading(false);
    }
  };

  // Date navigation functions
  const goToPreviousDay = () => {
    setSelectedDate(prev => subDays(prev, 1));
  };

  const goToNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const getDateDisplayText = () => {
    if (isToday(selectedDate)) return 'Today';
    if (isTomorrow(selectedDate)) return 'Tomorrow';
    if (isYesterday(selectedDate)) return 'Yesterday';
    return format(selectedDate, 'EEE, MMM d');
  };

  useEffect(() => {
    fetchMatches();
  }, [selectedDate, activeTab]);

  // Auto-refresh live matches every 30 seconds
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (activeTab === 'ongoing') {
      intervalId = setInterval(() => {
        console.log('Auto-refreshing live matches...');
        fetchMatches();
      }, 30000); // 30 seconds
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [activeTab, selectedDate]);

  // Filter and group matches by league
  const groupedMatches = React.useMemo(() => {
    console.log('Grouping matches - input matches:', matches);
    console.log('Selected league for filtering:', selectedLeague);
    
    const groups: { [leagueId: number]: LeagueGroup } = {};
    
    // Filter by selected league if not "All" (0)
    const filteredMatches = selectedLeague === 0 
      ? matches 
      : matches.filter(match => match.league.id === selectedLeague);
    
    console.log('Filtered matches after league filter:', filteredMatches);
    
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

    const result = Object.values(groups).sort((a, b) => a.league.name.localeCompare(b.league.name));
    console.log('Final grouped matches:', result);
    return result;
  }, [matches, selectedLeague]);


  const formatMatchTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a').replace(' ', '');
  };

  const isLive = (status: string) => {
    return status === '1H' || status === '2H' || status === 'HT';
  };

  const isFinished = (status: string) => {
    return status === 'FT' || status === 'AET' || status === 'PEN';
  };

  const handleMatchClick = (matchId: number) => {
    setClickedMatchId(matchId);
    // Add a small delay to show the click effect
    setTimeout(() => {
      navigate(`/matches/${matchId}`);
    }, 150);
  };

  const handleTeamClick = (teamId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent match card click
    navigate(`/teams/${teamId}`);
  };

  // Demo favorite teams data
  const favoriteTeams = [
    { id: 33, name: 'Man United', logo: 'https://media.api-sports.io/football/teams/33.png' },
    { id: 40, name: 'Liverpool', logo: 'https://media.api-sports.io/football/teams/40.png' },
    { id: 529, name: 'Barcelona', logo: 'https://media.api-sports.io/football/teams/529.png' },
    { id: 541, name: 'Real Madrid', logo: 'https://media.api-sports.io/football/teams/541.png' }
  ];

  // Get live matches for ticker
  const liveMatches = matches.filter(match => isLive(match.fixture.status.short));

  return (
    <div className="p-6">
      {/* Live Score Ticker */}
      {liveMatches.length > 0 && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-red-700 dark:text-red-300">LIVE MATCHES</span>
            </div>
            <TrendingUp className="w-4 h-4 text-red-500" />
          </div>
          
          <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
            {liveMatches.map((match) => (
              <button
                key={match.fixture.id}
                onClick={() => handleMatchClick(match.fixture.id)}
                className="flex-shrink-0 flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-700 hover:shadow-md transition-all group"
              >
                <div className="flex items-center space-x-2">
                  <img 
                    src={match.teams.home.logo} 
                    alt={match.teams.home.name}
                    className="w-6 h-6 object-contain"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {match.teams.home.name.length > 8 ? match.teams.home.name.substring(0, 8) + '...' : match.teams.home.name}
                  </span>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center space-x-2 text-lg font-bold animate-pulse">
                    <span className="text-gray-900 dark:text-white">
                      {match.goals.home ?? 0}
                    </span>
                    <span className="text-gray-400">-</span>
                    <span className="text-gray-900 dark:text-white">
                      {match.goals.away ?? 0}
                    </span>
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                    {match.fixture.status.elapsed}'
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {match.teams.away.name.length > 8 ? match.teams.away.name.substring(0, 8) + '...' : match.teams.away.name}
                  </span>
                  <img 
                    src={match.teams.away.logo} 
                    alt={match.teams.away.name}
                    className="w-6 h-6 object-contain"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Favorites Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span>Your Teams</span>
          </h3>
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
            Manage
          </button>
        </div>
        
        <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-2">
          {favoriteTeams.map((team) => (
            <button
              key={team.id}
              onClick={() => navigate(`/teams/${team.id}`)}
              className="flex-shrink-0 flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
            >
              <img 
                src={team.logo} 
                alt={team.name}
                className="w-10 h-10 object-contain group-hover:scale-110 transition-transform"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${team.name}&size=40&background=e5e7eb&color=6b7280`;
                }}
              />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                {team.name}
              </span>
            </button>
          ))}
          
          <button className="flex-shrink-0 flex flex-col items-center justify-center space-y-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-2 border-dashed border-gray-300 dark:border-gray-600">
            <div className="w-10 h-10 flex items-center justify-center">
              <span className="text-2xl text-gray-400">+</span>
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Add Team
            </span>
          </button>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={goToPreviousDay}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {getDateDisplayText()}
          </h2>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {format(selectedDate, 'MMMM d, yyyy')}
          </div>
        </div>

        <button 
          onClick={goToNextDay}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
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
          {/* Data source indicator */}
          <div className="flex items-center space-x-1 px-2 py-1 rounded-md text-xs bg-gray-100 dark:bg-gray-700">
            {usingRealData ? (
              <>
                <Wifi className="w-3 h-3 text-green-500" />
                <span className="text-green-600 dark:text-green-400">Live Data</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-orange-500" />
                <span className="text-orange-600 dark:text-orange-400">Demo Data</span>
              </>
            )}
          </div>
          
          {/* Refresh button */}
          <button 
            onClick={fetchMatches}
            disabled={loading}
            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
            title="Refresh matches"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
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
                    onClick={() => handleMatchClick(match.fixture.id)}
                    className={`flex items-center justify-between p-4 rounded-lg cursor-pointer match-card-hover transition-all duration-200 ${
                      clickedMatchId === match.fixture.id
                        ? 'scale-95 opacity-80'
                        : isLive(match.fixture.status.short) 
                          ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {/* Home team */}
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <button
                        onClick={(e) => handleTeamClick(match.teams.home.id, e)}
                        className="text-sm font-medium text-gray-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {match.teams.home.name}
                      </button>
                      <button
                        onClick={(e) => handleTeamClick(match.teams.home.id, e)}
                        className="flex-shrink-0 hover:scale-110 transition-transform"
                      >
                        <img 
                          src={match.teams.home.logo} 
                          alt={match.teams.home.name}
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://ui-avatars.com/api/?name=${match.teams.home.name}&size=24&background=e5e7eb&color=6b7280`;
                          }}
                        />
                      </button>
                    </div>

                    {/* Score/Time */}
                    <div className="mx-6 text-center">
                      {isLive(match.fixture.status.short) ? (
                        <div className="flex flex-col items-center">
                          <div className="flex items-center space-x-2 text-lg font-bold">
                            <span className="text-gray-900 dark:text-white animate-pulse">
                              {match.goals.home ?? 0}
                            </span>
                            <span className="text-gray-400 animate-pulse">-</span>
                            <span className="text-gray-900 dark:text-white animate-pulse">
                              {match.goals.away ?? 0}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 mt-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-red-500/50 shadow-sm"></div>
                            <span className="text-xs text-red-500 font-medium animate-pulse">
                              {match.fixture.status.elapsed}' LIVE
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
                      <button
                        onClick={(e) => handleTeamClick(match.teams.away.id, e)}
                        className="flex-shrink-0 hover:scale-110 transition-transform"
                      >
                        <img 
                          src={match.teams.away.logo} 
                          alt={match.teams.away.name}
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://ui-avatars.com/api/?name=${match.teams.away.name}&size=24&background=e5e7eb&color=6b7280`;
                          }}
                        />
                      </button>
                      <button
                        onClick={(e) => handleTeamClick(match.teams.away.id, e)}
                        className="text-sm font-medium text-gray-900 dark:text-white truncate text-right hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {match.teams.away.name}
                      </button>
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

      {/* Quick Stats & Highlights */}
      {!loading && matches.length > 0 && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Highlights */}
          <div className="lg:col-span-2 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
              Today's Highlights
            </h3>
            
            <div className="space-y-4">
              {/* Top scorer of the day */}
              <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Most Goals Today</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Manchester United vs Liverpool</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">3</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">goals</div>
                </div>
              </div>

              {/* Most exciting match */}
              <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Match of the Day</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Barcelona vs Real Madrid</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">LIVE</div>
                  <div className="text-xs text-red-500 animate-pulse">23' 1H</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Today's Stats</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Matches</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{matches.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Live Now</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">{liveMatches.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Goals</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {matches.reduce((total, match) => total + (match.goals.home || 0) + (match.goals.away || 0), 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Leagues</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{groupedMatches.length}</span>
                </div>
              </div>
            </div>
          </div>
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