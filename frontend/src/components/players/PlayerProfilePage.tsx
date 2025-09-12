import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Trophy, Target, Star, Bell, BellOff, User, Activity, TrendingUp } from 'lucide-react';
import { playerApi, matchesApi } from '@/services/api';
import { Player, Match, Statistic } from '@/types';
import { TeamBadge } from '@/components/common/TeamBadge';
import { MatchCard } from '@/components/matches/MatchCard';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectUser } from '@/store/slices/authSlice';
import { followPlayer, unfollowPlayer } from '@/store/slices/userSlice';

interface PlayerProfilePageProps {
  playerId?: string;
}

export const PlayerProfilePage: React.FC<PlayerProfilePageProps> = ({ playerId: propPlayerId }) => {
  const { playerId: paramPlayerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  
  const playerId = propPlayerId || paramPlayerId;
  const [player, setPlayer] = useState<Player | null>(null);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [statistics, setStatistics] = useState<Statistic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'statistics' | 'matches' | 'transfers'>('overview');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (!playerId) {
      setError('Player ID not found');
      setIsLoading(false);
      return;
    }

    loadPlayerData();
  }, [playerId]);

  const loadPlayerData = async () => {
    if (!playerId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [playerResponse, matchesResponse, statsResponse] = await Promise.all([
        playerApi.getPlayerById(parseInt(playerId)),
        matchesApi.getPlayerMatches(parseInt(playerId), { limit: 10 }),
        playerApi.getPlayerStatistics(parseInt(playerId))
      ]);

      if (playerResponse.data.success) {
        setPlayer(playerResponse.data.data);
        setIsFollowing(playerResponse.data.data.is_followed || false);
      }

      if (matchesResponse.data.success) {
        setRecentMatches(matchesResponse.data.data);
      }

      if (statsResponse.data.success) {
        setStatistics(statsResponse.data.data);
      }
    } catch (error) {
      console.error('Failed to load player data:', error);
      setError('Failed to load player information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!user || !player) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await dispatch(unfollowPlayer(player.id)).unwrap();
        setIsFollowing(false);
      } else {
        await dispatch(followPlayer(player.id)).unwrap();
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Failed to toggle follow status:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const getPlayerAge = (birthDate: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatPlayerPosition = (position: string) => {
    const positions: { [key: string]: string } = {
      'goalkeeper': 'Goalkeeper',
      'defender': 'Defender',
      'midfielder': 'Midfielder',
      'forward': 'Forward',
      'attacker': 'Attacker'
    };
    return positions[position?.toLowerCase()] || position;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <ErrorMessage 
          message={error || 'Player not found'}
          onRetry={loadPlayerData}
        />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'statistics', label: 'Statistics', icon: TrendingUp },
    { id: 'matches', label: 'Matches', icon: Activity },
    { id: 'transfers', label: 'Career', icon: Trophy }
  ] as const;

  const age = player.birth_date ? getPlayerAge(player.birth_date) : null;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Player Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              {/* Player Photo */}
              <div className="relative">
                {player.photo_url ? (
                  <img
                    src={player.photo_url}
                    alt={player.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white/20 bg-white/10"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-white/20 border-4 border-white/20 flex items-center justify-center">
                    <User className="w-12 h-12 text-white/60" />
                  </div>
                )}
                {player.jersey_number && (
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white text-primary-600 rounded-full flex items-center justify-center text-sm font-bold">
                    {player.jersey_number}
                  </div>
                )}
              </div>

              <div>
                <h1 className="text-3xl font-bold">{player.name}</h1>
                {player.position && (
                  <p className="text-primary-100 text-lg">
                    {formatPlayerPosition(player.position)}
                  </p>
                )}
                <div className="flex items-center space-x-4 mt-2 text-primary-100">
                  {age && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{age} years old</span>
                    </div>
                  )}
                  {player.nationality && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{player.nationality}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {user && (
              <Button
                onClick={handleFollowToggle}
                disabled={followLoading}
                variant={isFollowing ? 'secondary' : 'primary'}
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 border-white/20"
              >
                {isFollowing ? (
                  <>
                    <BellOff className="w-4 h-4 mr-2" />
                    Following
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4 mr-2" />
                    Follow
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Current Team */}
          {player.current_team && (
            <div className="mt-4 p-3 bg-white/10 backdrop-blur-sm rounded-lg">
              <div className="flex items-center space-x-3">
                <TeamBadge team={player.current_team} size="sm" />
                <div>
                  <p className="font-medium">Current Team</p>
                  <p className="text-sm text-primary-100">
                    {player.current_team.name}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Season Stats Overview */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Season Statistics
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Appearances', key: 'appearances', icon: Activity },
                    { label: 'Goals', key: 'goals', icon: Target },
                    { label: 'Assists', key: 'assists', icon: Star },
                    { label: 'Rating', key: 'rating', icon: TrendingUp }
                  ].map(({ label, key, icon: Icon }) => {
                    const stat = statistics.find(s => s.name === key);
                    return (
                      <div key={key} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <Icon className="w-6 h-6 mx-auto mb-2 text-primary-600 dark:text-primary-400" />
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {stat?.value || '0'}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Matches */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Recent Matches
                </h2>
                {recentMatches.length > 0 ? (
                  <div className="space-y-3">
                    {recentMatches.slice(0, 5).map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        variant="compact"
                        onClick={() => navigate(`/matches/${match.id}`)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No recent matches</p>
                )}
              </div>
            </div>

            {/* Player Info Sidebar */}
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Personal Information
                </h2>
                <div className="space-y-3 text-sm">
                  {player.full_name && player.full_name !== player.name && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Full Name:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {player.full_name}
                      </span>
                    </div>
                  )}
                  {player.birth_date && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Date of Birth:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {new Date(player.birth_date).toLocaleDateString()} ({age} years)
                      </span>
                    </div>
                  )}
                  {player.birth_place && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Birth Place:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {player.birth_place}
                      </span>
                    </div>
                  )}
                  {player.nationality && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Nationality:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {player.nationality}
                      </span>
                    </div>
                  )}
                  {player.height && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Height:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {player.height} cm
                      </span>
                    </div>
                  )}
                  {player.weight && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Weight:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {player.weight} kg
                      </span>
                    </div>
                  )}
                  {player.position && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Position:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {formatPlayerPosition(player.position)}
                      </span>
                    </div>
                  )}
                  {player.jersey_number && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Jersey Number:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        #{player.jersey_number}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Current Team Details */}
              {player.current_team && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Current Team
                  </h2>
                  <div 
                    className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => navigate(`/teams/${player.current_team?.id}`)}
                  >
                    <TeamBadge team={player.current_team} size="md" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {player.current_team.name}
                      </p>
                      {player.current_team.country && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {player.current_team.country}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'statistics' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Detailed Statistics
            </h2>
            {statistics.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {statistics.map((stat) => (
                  <div
                    key={stat.name}
                    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {stat.name.replace(/_/g, ' ')}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </div>
                    {stat.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {stat.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No statistics available</p>
            )}
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Match History
            </h2>
            {recentMatches.length > 0 ? (
              <div className="space-y-4">
                {recentMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    variant="detailed"
                    onClick={() => navigate(`/matches/${match.id}`)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No match history available</p>
            )}
          </div>
        )}

        {activeTab === 'transfers' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Career History
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Transfer history and career details coming soon...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};