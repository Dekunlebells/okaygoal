import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  User, 
  Activity,
  BarChart3,
  Users,
  Tv
} from 'lucide-react';

// Demo match data that matches our main content
const demoMatches = [
  {
    fixture: {
      id: 1,
      date: new Date().toISOString(),
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
      id: 2,
      date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
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
      id: 3,
      date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
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
      id: 4,
      date: new Date().toISOString(),
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
  },
  {
    fixture: {
      id: 5,
      date: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
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
  }
];

export const SimpleMatchDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const match = demoMatches.find(m => m.fixture.id === parseInt(id || '0'));
  
  if (!match) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚽</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Match not found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              The match you're looking for doesn't exist.
            </p>
            <button 
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isLive = match.fixture.status.short === '1H' || match.fixture.status.short === '2H' || match.fixture.status.short === 'HT';
  const isFinished = match.fixture.status.short === 'FT' || match.fixture.status.short === 'AET';
  const isScheduled = match.fixture.status.short === 'NS';

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          
          <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
            <img 
              src={match.league.logo} 
              alt={match.league.name}
              className="w-4 h-4 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://ui-avatars.com/api/?name=${match.league.name}&size=16&background=e5e7eb&color=6b7280`;
              }}
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {match.league.country} - {match.league.name}
            </span>
          </div>
          
          {isLive && (
            <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-xs font-medium">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
              <span>LIVE</span>
            </div>
          )}
        </div>

        {/* Match Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {/* Home Team */}
            <div className="flex flex-col items-center space-y-4 flex-1">
              <img 
                src={match.teams.home.logo} 
                alt={match.teams.home.name}
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${match.teams.home.name}&size=64&background=e5e7eb&color=6b7280`;
                }}
              />
              <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">
                {match.teams.home.name}
              </h2>
            </div>

            {/* Score and Status */}
            <div className="flex flex-col items-center space-y-4 px-8">
              {isScheduled ? (
                <div className="text-center">
                  <div className="text-lg font-medium text-gray-600 dark:text-gray-400">
                    {formatDate(match.fixture.date)}
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatTime(match.fixture.date)}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <span className="text-6xl font-black text-gray-900 dark:text-white">
                    {match.goals.home ?? 0}
                  </span>
                  <span className="text-4xl text-gray-400">-</span>
                  <span className="text-6xl font-black text-gray-900 dark:text-white">
                    {match.goals.away ?? 0}
                  </span>
                </div>
              )}
              
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                isLive 
                  ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                  : isFinished
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                    : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
              }`}>
                {isLive && `${match.fixture.status.elapsed}'`}
                {isFinished && 'Full Time'}
                {isScheduled && 'Scheduled'}
              </div>
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center space-y-4 flex-1">
              <img 
                src={match.teams.away.logo} 
                alt={match.teams.away.name}
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${match.teams.away.name}&size=64&background=e5e7eb&color=6b7280`;
                }}
              />
              <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">
                {match.teams.away.name}
              </h2>
            </div>
          </div>

          {/* Match Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span>{formatDate(match.fixture.date)} at {formatTime(match.fixture.date)}</span>
            </div>
            
            {match.fixture.venue?.name && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="w-4 h-4" />
                <span>{match.fixture.venue.name}</span>
              </div>
            )}
            
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Tv className="w-4 h-4" />
              <span>Available on TV</span>
            </div>
          </div>
        </div>

        {/* Match Details Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              <button className="flex items-center space-x-2 py-4 px-1 border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 font-medium text-sm">
                <Activity className="w-4 h-4" />
                <span>Overview</span>
              </button>
              <button className="flex items-center space-x-2 py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 font-medium text-sm">
                <BarChart3 className="w-4 h-4" />
                <span>Statistics</span>
              </button>
              <button className="flex items-center space-x-2 py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 font-medium text-sm">
                <Users className="w-4 h-4" />
                <span>Lineups</span>
              </button>
            </nav>
          </div>

          <div className="p-6">
            <div className="text-center py-8">
              <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {isScheduled ? 'Match Preview' : isLive ? 'Live Updates' : 'Match Summary'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {isScheduled 
                  ? 'Match details and team news will be available closer to kick-off'
                  : isLive 
                    ? 'Live match events and statistics will appear here during the match'
                    : 'Match highlights and full statistics are available after the final whistle'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};