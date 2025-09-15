import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  Trophy, 
  MapPin, 
  Clock,
  MoreHorizontal,
  Bell,
  Share2
} from 'lucide-react';

// Demo team data
const demoTeams = {
  33: {
    id: 33,
    name: 'Manchester United',
    logo: 'https://media.api-sports.io/football/teams/33.png',
    founded: 1878,
    venue: 'Old Trafford',
    capacity: 74879,
    city: 'Manchester',
    country: 'England'
  },
  40: {
    id: 40,
    name: 'Liverpool',
    logo: 'https://media.api-sports.io/football/teams/40.png',
    founded: 1892,
    venue: 'Anfield',
    capacity: 54074,
    city: 'Liverpool',
    country: 'England'
  },
  42: {
    id: 42,
    name: 'Arsenal',
    logo: 'https://media.api-sports.io/football/teams/42.png',
    founded: 1886,
    venue: 'Emirates Stadium',
    capacity: 60704,
    city: 'London',
    country: 'England'
  },
  49: {
    id: 49,
    name: 'Chelsea',
    logo: 'https://media.api-sports.io/football/teams/49.png',
    founded: 1905,
    venue: 'Stamford Bridge',
    capacity: 40341,
    city: 'London',
    country: 'England'
  },
  50: {
    id: 50,
    name: 'Manchester City',
    logo: 'https://media.api-sports.io/football/teams/50.png',
    founded: 1880,
    venue: 'Etihad Stadium',
    capacity: 55017,
    city: 'Manchester',
    country: 'England'
  },
  47: {
    id: 47,
    name: 'Tottenham',
    logo: 'https://media.api-sports.io/football/teams/47.png',
    founded: 1882,
    venue: 'Tottenham Hotspur Stadium',
    capacity: 62850,
    city: 'London',
    country: 'England'
  },
  529: {
    id: 529,
    name: 'Barcelona',
    logo: 'https://media.api-sports.io/football/teams/529.png',
    founded: 1899,
    venue: 'Camp Nou',
    capacity: 99354,
    city: 'Barcelona',
    country: 'Spain'
  },
  541: {
    id: 541,
    name: 'Real Madrid',
    logo: 'https://media.api-sports.io/football/teams/541.png',
    founded: 1902,
    venue: 'Santiago Bernabéu',
    capacity: 81044,
    city: 'Madrid',
    country: 'Spain'
  },
  157: {
    id: 157,
    name: 'Bayern Munich',
    logo: 'https://media.api-sports.io/football/teams/157.png',
    founded: 1900,
    venue: 'Allianz Arena',
    capacity: 75000,
    city: 'Munich',
    country: 'Germany'
  }
};

// Demo matches for teams
const demoMatches = [
  {
    fixture: {
      id: 1,
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: { short: 'FT', long: 'Match Finished' },
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
      away: { id: 42, name: 'Arsenal', logo: 'https://media.api-sports.io/football/teams/42.png' }
    },
    goals: { home: 3, away: 1 }
  },
  {
    fixture: {
      id: 2,
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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

export const TeamProfilePage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const team = teamId ? demoTeams[parseInt(teamId) as keyof typeof demoTeams] : null;

  const handleMatchClick = (matchId: number) => {
    navigate(`/matches/${matchId}`);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (!team) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="max-w-md mx-auto px-4 py-12 text-center">
          <div className="text-6xl mb-4">⚽</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Team not found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            The team you're looking for doesn't exist.
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
                src={team.logo} 
                alt={team.name}
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${team.name}&size=24&background=e5e7eb&color=6b7280`;
                }}
              />
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {team.name}
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

      {/* Team Info */}
      <div className="px-4 py-6">
        {/* Team Header */}
        <div className="text-center mb-6">
          <img 
            src={team.logo} 
            alt={team.name}
            className="w-20 h-20 object-contain mx-auto mb-4"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://ui-avatars.com/api/?name=${team.name}&size=80&background=e5e7eb&color=6b7280`;
            }}
          />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {team.name}
          </h1>
          
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>{team.city}, {team.country}</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>Founded {team.founded}</span>
            </div>
          </div>
        </div>

        {/* Stadium Info */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Home Stadium</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{team.venue}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Capacity: {team.capacity.toLocaleString()}
              </p>
            </div>
            <MapPin className="w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Trophy },
              { id: 'fixtures', label: 'Fixtures', icon: Calendar },
              { id: 'squad', label: 'Squad', icon: Users },
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
            <div className="space-y-6">
              {/* Recent Matches */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Recent Matches
                </h2>
                <div className="space-y-3">
                  {demoMatches.filter(match => 
                    match.teams.home.id === team.id || match.teams.away.id === team.id
                  ).map((match) => (
                    <div 
                      key={match.fixture.id}
                      onClick={() => handleMatchClick(match.fixture.id)}
                      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <img 
                            src={match.teams.home.logo} 
                            alt={match.teams.home.name}
                            className="w-6 h-6 object-contain"
                          />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {match.teams.home.name}
                          </span>
                        </div>
                        
                        <div className="text-center">
                          {match.fixture.status.short === 'NS' ? (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {formatTime(match.fixture.date)}
                            </div>
                          ) : (
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {match.goals.home} - {match.goals.away}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(match.fixture.date)}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {match.teams.away.name}
                          </span>
                          <img 
                            src={match.teams.away.logo} 
                            alt={match.teams.away.name}
                            className="w-6 h-6 object-contain"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'fixtures' && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Upcoming Fixtures
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Fixture information will be available soon
              </p>
            </div>
          )}

          {activeTab === 'squad' && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Squad Information
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Player roster and squad details coming soon
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};