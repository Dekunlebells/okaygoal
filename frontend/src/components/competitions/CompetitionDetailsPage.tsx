import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Trophy, Users, Star, Bell, BellOff, MapPin, Crown, Medal, Target } from 'lucide-react';
import { competitionsApi } from '@/services/api';
import { Competition, Team, Match, Player } from '@/types';
import { CompetitionBadge } from '@/components/common/CompetitionBadge';
import { TeamBadge } from '@/components/common/TeamBadge';
import { MatchCard } from '@/components/matches/MatchCard';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectUser } from '@/store/slices/authSlice';
import { followCompetition, unfollowCompetition } from '@/store/slices/userSlice';

interface CompetitionDetailsPageProps {
  competitionId?: string;
}

interface Standing {
  rank: number;
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form?: string[];
}

interface TopScorer {
  player: Player;
  goals: number;
  assists: number;
  matches: number;
}

export const CompetitionDetailsPage: React.FC<CompetitionDetailsPageProps> = ({ competitionId: propCompetitionId }) => {
  const { competitionId: paramCompetitionId } = useParams<{ competitionId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  
  const competitionId = propCompetitionId || paramCompetitionId;
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [fixtures, setFixtures] = useState<Match[]>([]);
  const [topScorers, setTopScorers] = useState<TopScorer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'standings' | 'fixtures' | 'results' | 'stats'>('standings');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (!competitionId) {
      setError('Competition ID not found');
      setIsLoading(false);
      return;
    }

    loadCompetitionData();
  }, [competitionId]);

  const loadCompetitionData = async () => {
    if (!competitionId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [competitionResponse, standingsResponse, fixturesResponse, scorersResponse] = await Promise.all([
        competitionsApi.getCompetitionDetails(parseInt(competitionId)),
        competitionsApi.getCompetitionStandings(parseInt(competitionId)),
        competitionsApi.getCompetitionFixtures(parseInt(competitionId)),
        competitionsApi.getCompetitionTopScorers(parseInt(competitionId))
      ]);

      if (competitionResponse.data.success) {
        setCompetition(competitionResponse.data.data);
        setIsFollowing(competitionResponse.data.data.is_followed || false);
      }

      if (standingsResponse.data.success) {
        setStandings(standingsResponse.data.data);
      }

      if (fixturesResponse.data.success) {
        setFixtures(fixturesResponse.data.data);
      }

      if (scorersResponse.data.success) {
        setTopScorers(scorersResponse.data.data);
      }
    } catch (error) {
      console.error('Failed to load competition data:', error);
      setError('Failed to load competition information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!user || !competition) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await dispatch(unfollowCompetition(competition.id)).unwrap();
        setIsFollowing(false);
      } else {
        await dispatch(followCompetition(competition.id)).unwrap();
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Failed to toggle follow status:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const getFormColor = (result: string) => {
    switch (result?.toUpperCase()) {
      case 'W': return 'bg-green-500';
      case 'D': return 'bg-yellow-500';
      case 'L': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getPositionColor = (position: number) => {
    if (position <= 4) return 'text-green-600 dark:text-green-400'; // Champions League
    if (position <= 6) return 'text-blue-600 dark:text-blue-400'; // Europa League
    if (position >= standings.length - 2) return 'text-red-600 dark:text-red-400'; // Relegation
    return 'text-gray-600 dark:text-gray-400';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !competition) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <ErrorMessage 
          message={error || 'Competition not found'}
          onRetry={loadCompetitionData}
        />
      </div>
    );
  }

  const tabs = [
    { id: 'standings', label: 'Standings', icon: Trophy },
    { id: 'fixtures', label: 'Fixtures', icon: Calendar },
    { id: 'results', label: 'Results', icon: Medal },
    { id: 'stats', label: 'Stats', icon: Target }
  ] as const;

  const upcomingMatches = fixtures.filter(match => match.status === 'scheduled').slice(0, 10);
  const recentMatches = fixtures.filter(match => match.status === 'finished').slice(0, 10);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Competition Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <CompetitionBadge
                competition={competition}
                size="xl"
                className="bg-white/10 backdrop-blur-sm"
              />
              <div>
                <h1 className="text-3xl font-bold">{competition.name}</h1>
                <div className="flex items-center space-x-4 mt-2 text-primary-100">
                  {competition.country && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{competition.country}</span>
                    </div>
                  )}
                  {competition.season && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Season {competition.season}</span>
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

          {competition.description && (
            <div className="mt-4 p-3 bg-white/10 backdrop-blur-sm rounded-lg">
              <p className="text-primary-100">{competition.description}</p>
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
        {activeTab === 'standings' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                League Table
              </h2>
              
              {standings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <th className="text-left py-3 px-2">Pos</th>
                        <th className="text-left py-3 px-2">Team</th>
                        <th className="text-center py-3 px-2">MP</th>
                        <th className="text-center py-3 px-2">W</th>
                        <th className="text-center py-3 px-2">D</th>
                        <th className="text-center py-3 px-2">L</th>
                        <th className="text-center py-3 px-2">GF</th>
                        <th className="text-center py-3 px-2">GA</th>
                        <th className="text-center py-3 px-2">GD</th>
                        <th className="text-center py-3 px-2">Pts</th>
                        <th className="text-center py-3 px-2">Form</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((standing, index) => (
                        <tr
                          key={standing.team.id}
                          className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <td className={`py-4 px-2 text-center font-bold ${getPositionColor(standing.rank)}`}>
                            {standing.rank}
                          </td>
                          <td className="py-4 px-2">
                            <div 
                              className="flex items-center space-x-3 cursor-pointer"
                              onClick={() => navigate(`/teams/${standing.team.id}`)}
                            >
                              <TeamBadge team={standing.team} size="xs" />
                              <span className="font-medium text-gray-900 dark:text-white">
                                {standing.team.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-2 text-center text-gray-600 dark:text-gray-400">
                            {standing.played}
                          </td>
                          <td className="py-4 px-2 text-center text-green-600 dark:text-green-400">
                            {standing.won}
                          </td>
                          <td className="py-4 px-2 text-center text-yellow-600 dark:text-yellow-400">
                            {standing.drawn}
                          </td>
                          <td className="py-4 px-2 text-center text-red-600 dark:text-red-400">
                            {standing.lost}
                          </td>
                          <td className="py-4 px-2 text-center text-gray-600 dark:text-gray-400">
                            {standing.goalsFor}
                          </td>
                          <td className="py-4 px-2 text-center text-gray-600 dark:text-gray-400">
                            {standing.goalsAgainst}
                          </td>
                          <td className={`py-4 px-2 text-center font-medium ${
                            standing.goalDifference > 0 ? 'text-green-600 dark:text-green-400' :
                            standing.goalDifference < 0 ? 'text-red-600 dark:text-red-400' :
                            'text-gray-600 dark:text-gray-400'
                          }`}>
                            {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                          </td>
                          <td className="py-4 px-2 text-center font-bold text-gray-900 dark:text-white">
                            {standing.points}
                          </td>
                          <td className="py-4 px-2">
                            {standing.form && (
                              <div className="flex items-center justify-center space-x-1">
                                {standing.form.slice(-5).map((result, idx) => (
                                  <div
                                    key={idx}
                                    className={`w-2 h-2 rounded-full ${getFormColor(result)}`}
                                    title={result === 'W' ? 'Win' : result === 'D' ? 'Draw' : 'Loss'}
                                  />
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Legend */}
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-green-100 dark:bg-green-900/20 border-l-2 border-green-500"></div>
                      <span>Champions League</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-blue-100 dark:bg-blue-900/20 border-l-2 border-blue-500"></div>
                      <span>Europa League</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-red-100 dark:bg-red-900/20 border-l-2 border-red-500"></div>
                      <span>Relegation</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No standings data available
                </p>
              )}
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
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No upcoming fixtures
              </p>
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
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No recent results
              </p>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Top Scorers */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Top Scorers
              </h2>
              {topScorers.length > 0 ? (
                <div className="space-y-3">
                  {topScorers.slice(0, 10).map((scorer, index) => (
                    <div
                      key={scorer.player.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => navigate(`/players/${scorer.player.id}`)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full font-bold text-sm">
                          {index + 1}
                        </div>
                        {scorer.player.photo_url ? (
                          <img
                            src={scorer.player.photo_url}
                            alt={scorer.player.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                            <Star className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {scorer.player.name}
                          </p>
                          {scorer.player.current_team && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {scorer.player.current_team.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-gray-900 dark:text-white">
                          {scorer.goals}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {scorer.assists > 0 && `${scorer.assists} assists`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No top scorers data available
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};