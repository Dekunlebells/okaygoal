import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  Share2,
  Bell,
  MoreHorizontal,
  TrendingUp,
  Users,
  Zap
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
  const [activeTab, setActiveTab] = useState('overview');
  
  const match = demoMatches.find(m => m.fixture.id === parseInt(id || '0'));
  
  if (!match) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="max-w-md mx-auto px-4 py-12 text-center">
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
    );
  }

  const isLive = match.fixture.status.short === '1H' || match.fixture.status.short === '2H' || match.fixture.status.short === 'HT';
  const isFinished = match.fixture.status.short === 'FT' || match.fixture.status.short === 'AET';
  const isScheduled = match.fixture.status.short === 'NS';

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            
            <div className="flex items-center space-x-2">
              <img 
                src={match.league.logo} 
                alt={match.league.name}
                className="w-5 h-5 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${match.league.name}&size=20&background=e5e7eb&color=6b7280`;
                }}
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {match.league.name}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
              <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
              <MoreHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Match Info */}
      <div className="px-4 py-6">
        {/* Teams and Score */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-8 mb-4">
            {/* Home Team */}
            <div className="flex flex-col items-center space-y-2">
              <img 
                src={match.teams.home.logo} 
                alt={match.teams.home.name}
                className="w-12 h-12 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${match.teams.home.name}&size=48&background=e5e7eb&color=6b7280`;
                }}
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white text-center">
                {match.teams.home.name}
              </span>
            </div>

            {/* Score */}
            <div className="flex flex-col items-center space-y-1">
              {isScheduled ? (
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatTime(match.fixture.date)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(match.fixture.date)}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center space-x-3">
                    <span className={`text-4xl font-bold text-gray-900 dark:text-white relative ${
                      isLive ? 'animate-pulse' : ''
                    }`}>
                      {match.goals.home ?? 0}
                      {isLive && (
                        <span className="absolute inset-0 text-red-500 animate-ping opacity-20">
                          {match.goals.home ?? 0}
                        </span>
                      )}
                    </span>
                    <span className={`text-2xl text-gray-400 ${isLive ? 'animate-pulse' : ''}`}>-</span>
                    <span className={`text-4xl font-bold text-gray-900 dark:text-white relative ${
                      isLive ? 'animate-pulse' : ''
                    }`}>
                      {match.goals.away ?? 0}
                      {isLive && (
                        <span className="absolute inset-0 text-red-500 animate-ping opacity-20">
                          {match.goals.away ?? 0}
                        </span>
                      )}
                    </span>
                  </div>
                  {isLive && (
                    <div className="text-xs text-red-600 dark:text-red-400 font-medium animate-pulse">
                      {match.fixture.status.elapsed}' LIVE
                    </div>
                  )}
                  {isFinished && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Full Time
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center space-y-2">
              <img 
                src={match.teams.away.logo} 
                alt={match.teams.away.name}
                className="w-12 h-12 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${match.teams.away.name}&size=48&background=e5e7eb&color=6b7280`;
                }}
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white text-center">
                {match.teams.away.name}
              </span>
            </div>
          </div>

          {/* Match Details */}
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{formatDate(match.fixture.date)}</span>
            </div>
            {match.fixture.venue?.name && (
              <>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span>{match.fixture.venue.name}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Status Bar */}
        {isLive && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-6 animate-pulse">
            <div className="flex items-center justify-center space-x-2 text-red-700 dark:text-red-300">
              <div className="relative">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-2 h-2 bg-red-500 rounded-full animate-ping opacity-50"></div>
              </div>
              <span className="text-sm font-medium animate-pulse">
                Live - {match.fixture.status.elapsed}'
              </span>
              <div className="w-1 h-1 bg-red-500 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Zap },
              { id: 'stats', label: 'Stats', icon: TrendingUp },
              { id: 'lineups', label: 'Lineups', icon: Users },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="text-center py-12">
              <Zap className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {isScheduled ? 'Match Preview' : isLive ? 'Live Updates' : 'Match Summary'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {isScheduled 
                  ? 'Pre-match analysis and team news will appear here'
                  : isLive 
                    ? 'Live commentary and match events updating in real-time'
                    : 'Post-match analysis and highlights available'
                }
              </p>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Match Statistics
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Detailed match statistics will be available during and after the match
              </p>
            </div>
          )}

          {activeTab === 'lineups' && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Team Lineups
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Starting lineups and formations will be revealed closer to kick-off
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};