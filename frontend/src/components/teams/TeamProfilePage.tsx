import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Users, Trophy, Star, Bell, BellOff, MapPin, Globe, Shield } from 'lucide-react';
import { teamApi, matchesApi } from '@/services/api';
import { Team, Match, Statistic } from '@/types';
import { TeamBadge } from '@/components/common/TeamBadge';
import { MatchCard } from '@/components/matches/MatchCard';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectUser } from '@/store/slices/authSlice';
import { followTeam, unfollowTeam } from '@/store/slices/userSlice';

interface TeamProfilePageProps {
  teamId?: string;
}

export const TeamProfilePage: React.FC<TeamProfilePageProps> = ({ teamId: propTeamId }) => {
  const { teamId: paramTeamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  
  const teamId = propTeamId || paramTeamId;
  const [team, setTeam] = useState<Team | null>(null);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [statistics, setStatistics] = useState<Statistic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'fixtures' | 'results' | 'squad' | 'statistics'>('overview');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (!teamId) {
      setError('Team ID not found');
      setIsLoading(false);
      return;
    }

    loadTeamData();
  }, [teamId]);

  const loadTeamData = async () => {
    if (!teamId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [teamResponse, recentResponse, upcomingResponse, statsResponse] = await Promise.all([
        teamApi.getTeamById(parseInt(teamId)),
        matchesApi.getTeamMatches(parseInt(teamId), { limit: 5, status: 'finished' }),
        matchesApi.getTeamMatches(parseInt(teamId), { limit: 5, status: 'scheduled' }),
        teamApi.getTeamStatistics(parseInt(teamId))
      ]);

      if (teamResponse.data.success) {
        setTeam(teamResponse.data.data);
        setIsFollowing(teamResponse.data.data.is_followed || false);
      }

      if (recentResponse.data.success) {
        setRecentMatches(recentResponse.data.data);
      }

      if (upcomingResponse.data.success) {
        setUpcomingMatches(upcomingResponse.data.data);
      }

      if (statsResponse.data.success) {
        setStatistics(statsResponse.data.data);
      }
    } catch (error) {
      console.error('Failed to load team data:', error);
      setError('Failed to load team information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!user || !team) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await dispatch(unfollowTeam(team.id)).unwrap();
        setIsFollowing(false);
      } else {
        await dispatch(followTeam(team.id)).unwrap();
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Failed to toggle follow status:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <ErrorMessage 
          message={error || 'Team not found'}
          onRetry={loadTeamData}
        />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'fixtures', label: 'Fixtures', icon: Calendar },
    { id: 'results', label: 'Results', icon: Trophy },
    { id: 'squad', label: 'Squad', icon: Users },
    { id: 'statistics', label: 'Statistics', icon: Star }
  ] as const;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Team Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <TeamBadge
                team={team}
                size="xl"
                className="bg-white/10 backdrop-blur-sm"
              />
              <div>
                <h1 className="text-3xl font-bold">{team.name}</h1>
                {team.full_name && team.full_name !== team.name && (
                  <p className="text-primary-100 text-lg">{team.full_name}</p>
                )}
                <div className="flex items-center space-x-4 mt-2 text-primary-100">
                  {team.country && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{team.country}</span>
                    </div>
                  )}
                  {team.founded && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Founded {team.founded}</span>
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

          {team.venue_name && (
            <div className="mt-4 p-3 bg-white/10 backdrop-blur-sm rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{team.venue_name}</p>
                  {team.venue_capacity && (
                    <p className="text-sm text-primary-100">
                      Capacity: {team.venue_capacity.toLocaleString()}
                    </p>
                  )}
                </div>
                {team.venue_city && (
                  <p className="text-sm text-primary-100">{team.venue_city}</p>
                )}
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
            {/* Quick Stats */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Matches */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Recent Matches
                </h2>
                {recentMatches.length > 0 ? (
                  <div className="space-y-3">
                    {recentMatches.slice(0, 3).map((match) => (
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

              {/* Upcoming Matches */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Upcoming Matches
                </h2>
                {upcomingMatches.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingMatches.slice(0, 3).map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        variant="compact"
                        onClick={() => navigate(`/matches/${match.id}`)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No upcoming matches</p>
                )}
              </div>
            </div>

            {/* Team Info Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Quick Stats
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Matches Played</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {statistics.find(s => s.name === 'matches_played')?.value || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Wins</span>
                    <span className="font-medium text-green-600">
                      {statistics.find(s => s.name === 'wins')?.value || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Draws</span>
                    <span className="font-medium text-yellow-600">
                      {statistics.find(s => s.name === 'draws')?.value || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Losses</span>
                    <span className="font-medium text-red-600">
                      {statistics.find(s => s.name === 'losses')?.value || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Goals For</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {statistics.find(s => s.name === 'goals_for')?.value || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Goals Against</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {statistics.find(s => s.name === 'goals_against')?.value || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Team Details */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Team Details
                </h2>
                <div className="space-y-3 text-sm">
                  {team.coach_name && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Manager:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {team.coach_name}
                      </span>
                    </div>
                  )}
                  {team.founded && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Founded:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {team.founded}
                      </span>
                    </div>
                  )}
                  {team.venue_name && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Stadium:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {team.venue_name}
                      </span>
                    </div>
                  )}
                  {team.venue_capacity && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Capacity:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {team.venue_capacity.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fixtures' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Upcoming Fixtures
            </h2>
            {upcomingMatches.length > 0 ? (
              <div className="space-y-4">
                {upcomingMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    variant="detailed"
                    onClick={() => navigate(`/matches/${match.id}`)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No upcoming fixtures</p>
            )}
          </div>
        )}

        {activeTab === 'results' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Results
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
              <p className="text-gray-500 dark:text-gray-400">No recent results</p>
            )}
          </div>
        )}

        {activeTab === 'squad' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Squad
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Squad information coming soon...
            </p>
          </div>
        )}

        {activeTab === 'statistics' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Season Statistics
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
      </div>
    </div>
  );
};